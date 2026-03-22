import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { extractInvoiceData } from "@/lib/openai";
import { syncToGoogle } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import { getValidGoogleAccessToken } from "@/lib/google-auth";
import { ensureFreeCreditsReset } from "@/lib/credits";

// Disable Next.js body parser to handle raw FormData
export const runtime = "nodejs";

export async function POST(request: Request) {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Load user and apply plan logic
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            plan: true,
            credits: true,
            sheetId: true,
            sheetName: true,
            sheetMapping: true,
            filenameMapping: true,
            driveFolderId: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 401 });
    }

    const isPro = user.plan === "pro";

    if (!isPro) {
        const creditsAfterReset = await ensureFreeCreditsReset(userId);
        if (creditsAfterReset <= 0) {
            return NextResponse.json(
                { error: "No credits remaining this month. Resets next month or upgrade to Pro for unlimited." },
                { status: 402 }
            );
        }
    }

    const accessToken = await getValidGoogleAccessToken(userId);
    if (!accessToken) {
        return NextResponse.json(
            { error: "Google access token missing. Please sign in again." },
            { status: 401 }
        );
    }

    // 3. Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sheetId = (formData.get("sheetId") as string) || user.sheetId || "";

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Basic server-side validation to avoid abuse
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    const contentType = (file as any).type as string | undefined;
    const size = (file as any).size as number | undefined;

    if (size !== undefined && size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
            { error: "File too large. Please upload a PDF smaller than 10 MB." },
            { status: 413 }
        );
    }

    if (
        contentType &&
        contentType !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {
        return NextResponse.json(
            { error: "Invalid file type. Only PDF invoices are allowed." },
            { status: 400 }
        );
    }

    if (!sheetId) {
        return NextResponse.json(
            {
                error:
                    "No Google Sheet ID configured. Please set it in Integrations settings.",
            },
            { status: 400 }
        );
    }

    const originalFilename = file.name;
    let filename = originalFilename;

    // Prevent duplicate successful uploads (match by original name; log may store transformed filename)
    const existingLog = await prisma.processingLog.findFirst({
        where: {
            userId,
            status: "success",
            OR: [
                { originalFilename: originalFilename },
                { originalFilename: null, filename: originalFilename },
            ],
        },
        select: { id: true },
    });

    if (existingLog) {
        return NextResponse.json(
            { error: `File "${originalFilename}" has already been processed.` },
            { status: 409 }
        );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let invoiceData;
    let driveLink = "";
    let sheetRow = 0;
    let status = "success";

    try {
        // For pdf-parse 1.x: default export is a callable function
        const pdfModule: any = await import("pdf-parse");
        const pdfParse =
            typeof pdfModule === "function"
                ? pdfModule
                : typeof pdfModule.default === "function"
                ? pdfModule.default
                : null;

        if (!pdfParse) {
            throw new Error("pdf-parse did not export a compatible parser function");
        }

        const textResult = await pdfParse(buffer);
        const pdfText = textResult.text;

        // 5. AI extraction
        invoiceData = await extractInvoiceData(pdfText);

        // 6. Determine filename using optional mapping based on last 4 digits
        filename = originalFilename;
        const last4 = invoiceData.card_last_4;
        const billedTo = invoiceData.billed_to as string | undefined;
        const mapping = (user as any).filenameMapping as Record<string, string> | null | undefined;
        if (last4 && mapping && typeof mapping === "object" && mapping[last4]) {
            filename = `${mapping[last4]} ${originalFilename}`;
        }

        // 6.1 Append billed_to after filename, before extension if available
        if (billedTo && billedTo.trim().length > 0) {
            const trimmed = billedTo.trim();
            const dotIndex = filename.lastIndexOf(".");
            if (dotIndex > 0) {
                const base = filename.slice(0, dotIndex);
                const ext = filename.slice(dotIndex);
                filename = `${base} (${trimmed})${ext}`;
            } else {
                filename = `${filename} (${trimmed})`;
            }
        }

        // 7. Sync to Google Drive + Sheets
        const syncResult = await syncToGoogle(
            invoiceData,
            buffer,
            filename,
            accessToken,
            sheetId,
            user.sheetName,
            user.sheetMapping,
            user.driveFolderId ?? null
        );
        driveLink = syncResult.driveLink;
        sheetRow = syncResult.sheetRow;
    } catch (err: any) {
        console.error("Processing error:", err);
        status = "error";
        // Log the failure without crashing
        await prisma.processingLog.create({
            data: {
                userId,
                filename: originalFilename,
                originalFilename,
                status: "error",
            },
        });
        return NextResponse.json(
            { error: "Processing failed: " + err.message },
            { status: 500 }
        );
    }

    // 8. Deduct credit (free plan only) and log
    await prisma.$transaction(async (tx) => {
        if (!isPro) {
            await tx.user.update({
                where: { id: userId },
                data: { credits: { decrement: 1 } },
            });
        }
        await tx.processingLog.create({
            data: {
                userId,
                filename,
                originalFilename,
                invoiceDate: invoiceData?.date,
                cardLast4: invoiceData?.card_last_4,
                amount: invoiceData?.amount,
                currency: invoiceData?.currency,
                driveLink,
                sheetRow,
                status,
            },
        });
    });

    // 8. Return result
    return NextResponse.json({
        success: true,
        data: {
            filename,
            ...invoiceData,
            driveLink,
            sheetRow,
        },
    });
}
