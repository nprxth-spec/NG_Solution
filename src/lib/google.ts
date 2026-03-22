import { google } from "googleapis";
import { InvoiceData } from "./openai";

function getOAuth2Client(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
}

/**
 * Find or create a Google Drive folder named `FB_Invoices_YYYY-MM`.
 */
async function getOrCreateFolder(
    drive: ReturnType<typeof google.drive>,
    invoiceDate: string
): Promise<string> {
    const yearMonth = invoiceDate?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
    const folderName = `FB_Invoices_${yearMonth}`;

    const searchRes = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
        return searchRes.data.files[0].id!;
    }

    const createRes = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
    });

    return createRes.data.id!;
}

/**
 * For unsuccessful payments, we want a dedicated child folder under the main
 * target folder. If someone in the team already created it manually, we reuse
 * that folder; otherwise we create it.
 *
 * Example:
 *   - Target folder:   FB_Invoices_2026-03   (or the configured Drive folder)
 *   - Failed subfolder: FB_Invoices_2026-03 / _Unsuccessful
 */
async function getOrCreateFailedSubfolder(
    drive: ReturnType<typeof google.drive>,
    parentFolderId: string
): Promise<string> {
    const failedName = "_Unsuccessful";

    const searchRes = await drive.files.list({
        q: [
            `name='${failedName}'`,
            "mimeType='application/vnd.google-apps.folder'",
            "trashed=false",
            `'${parentFolderId}' in parents`,
        ].join(" and "),
        fields: "files(id, name)",
        spaces: "drive",
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
        return searchRes.data.files[0].id!;
    }

    const createRes = await drive.files.create({
        requestBody: {
            name: failedName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentFolderId],
        },
        fields: "id",
    });

    return createRes.data.id!;
}

// Define the structure of sheet mapping
export interface SheetMapping {
    date: string;
    card_last_4: string;
    amount: string;        // column for successful payment amount (e.g. G)
    amountFailed?: string; // column for unsuccessful payment amount (e.g. H), default H
    currency: string;
    filename: string;
    driveLink: string;
    billed_to: string;
}

/**
 * Fetch the spreadsheet document title (file name) by ID.
 */
export async function getSpreadsheetTitle(
    sheetId: string,
    accessToken: string
): Promise<string> {
    const auth = getOAuth2Client(accessToken);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: "properties/title",
    });
    return (res.data.properties?.title as string) ?? "";
}

/**
 * Fetch available tabs (sheets) for a given Google Spreadsheet ID.
 */
export async function getSpreadsheetTabs(
    sheetId: string,
    accessToken: string
): Promise<{ id: number; title: string }[]> {
    const auth = getOAuth2Client(accessToken);
    const sheets = google.sheets({ version: "v4", auth });

    try {
        const res = await sheets.spreadsheets.get({
            spreadsheetId: sheetId,
            includeGridData: false,
        });

        const tabs = res.data.sheets?.map(s => ({
            id: s.properties?.sheetId ?? 0,
            title: s.properties?.title ?? "",
        })) ?? [];

        return tabs;
    } catch (error: any) {
        // Log full error for debugging
        console.error("Error fetching spreadsheet tabs:", error?.response?.data || error);

        // Surface more helpful message to UI
        const apiMessage: string | undefined =
            error?.response?.data?.error?.message ||
            error?.message;

        if (apiMessage) {
            throw new Error(apiMessage);
        }

        throw new Error("Failed to fetch spreadsheet tabs.");
    }
}

export interface SyncResult {
    driveLink: string;
    sheetRow: number;
}

/**
 * Upload the PDF to Google Drive and append a row to Google Sheets using custom mappings.
 */
export async function syncToGoogle(
    data: InvoiceData,
    fileBuffer: Buffer,
    filename: string,
    accessToken: string,
    sheetId: string,
    sheetName: string | null = null,
    sheetMapping: any | null = null,
    driveFolderId: string | null = null
): Promise<SyncResult> {
    const auth = getOAuth2Client(accessToken);
    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

    // 1. Determine target Drive folder
    const baseFolderId = driveFolderId && driveFolderId.trim().length > 0
        ? driveFolderId
        : await getOrCreateFolder(drive, data.date);

    // If this is an unsuccessful payment, use/create a dedicated "_Unsuccessful" subfolder
    const folderId = data.paymentSuccess
        ? baseFolderId
        : await getOrCreateFailedSubfolder(drive, baseFolderId);

    // 2. Upload the PDF file
    const { Readable } = await import("stream");
    const fileStream = Readable.from(fileBuffer);

    const uploadRes = await drive.files.create({
        requestBody: {
            name: filename,
            parents: [folderId],
        },
        media: {
            mimeType: "application/pdf",
            body: fileStream,
        },
        fields: "id, webViewLink",
    });

    const driveLink = uploadRes.data.webViewLink ?? "";

    // 3. Append row to Google Sheet
    //
    // Requirement:
    // - Find the last used row first.
    // - Start at column A for the row number, but
    // - Write values only into the exact columns defined in sheetMapping
    //   so any columns in-between (with formulas) are not touched.

    // 3.1 Determine next row based on column A
    const baseRange = sheetName ? `'${sheetName}'!A:A` : "A:A";
    const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: baseRange,
    });
    const lastRow = existing.data.values?.length ?? 0;
    const nextRow = lastRow + 1; // if sheet empty => 1

    const mapping: SheetMapping | null =
        sheetMapping && typeof sheetMapping === "object" ? (sheetMapping as SheetMapping) : null;

    // Helper to queue a single-cell update for a given column letter
    const updates: Promise<any>[] = [];
    const writeIfMapped = (col: string | undefined | null, value: any) => {
        if (!col || col.trim() === "") return; // treat empty as "Skip"
        const colLetter = col.toUpperCase();
        const cellRange = sheetName
            ? `'${sheetName}'!${colLetter}${nextRow}`
            : `${colLetter}${nextRow}`;
        updates.push(
            sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: cellRange,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [[value]] },
            })
        );
    };

    if (mapping) {
        // Use explicit mapping; skip fields whose mapping is empty
        writeIfMapped(mapping.date, data.date ?? "");
        writeIfMapped(mapping.billed_to, data.billed_to ?? "");
        writeIfMapped(mapping.card_last_4, data.card_last_4 ?? "");
        // Success → column G (amount); failed → column H (amountFailed)
        if (data.paymentSuccess) {
            writeIfMapped(mapping.amount, data.amount ?? 0);
        } else {
            writeIfMapped(mapping.amountFailed ?? "H", data.amount ?? 0);
        }
        writeIfMapped(mapping.currency, data.currency ?? "");
        writeIfMapped(mapping.filename, filename);
        writeIfMapped(mapping.driveLink, driveLink);
    } else {
        // Fallback: contiguous write starting at A for a reasonable default order
        const valuesArray: any[] = [
            data.date ?? "",
            data.billed_to ?? "",
            data.card_last_4 ?? "",
            data.amount ?? 0,
            data.currency ?? "",
            filename,
            driveLink,
        ];
        const targetRange = sheetName ? `'${sheetName}'!A${nextRow}` : `A${nextRow}`;
        updates.push(
            sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: targetRange,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [valuesArray] },
            })
        );
    }

    await Promise.all(updates);

    const sheetRow = nextRow;
    return { driveLink, sheetRow };
}
