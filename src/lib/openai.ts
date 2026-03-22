import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface InvoiceData {
    date: string;
    card_last_4: string;
    amount: number;
    currency: string;
    billed_to: string;
    /** true = payment successful (write amount to column G); false = payment failed/unsuccessful (write amount to column H). */
    paymentSuccess: boolean;
}

// Define the exact JSON schema Gemini must return
const invoiceSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        date: {
            type: SchemaType.STRING,
            description: "Invoice date or Billing Date in YYYY-MM-DD format",
        },
        card_last_4: {
            type: SchemaType.STRING,
            description: "Exactly the last 4 digits of the payment card (e.g., '1234' from 'MasterCard *1234' or 'Visa *1234')",
        },
        amount: {
            type: SchemaType.NUMBER,
            description: "The TOTAL amount actually charged/paid (the final amount that was debited from the card). Must include VAT, tax, and any fees. If the receipt shows both a subtotal (e.g. 20.00) and a total with VAT (e.g. 20.20), use the total (20.20), NOT the subtotal. Look for fields like 'Total', 'Amount paid', 'Total charged', 'Amount due' or similar.",
        },
        currency: {
            type: SchemaType.STRING,
            description: "3-letter currency code (e.g., USD or THB)",
        },
        billed_to: {
            type: SchemaType.STRING,
            description: "The name of the person or company the invoice is billed to (ใบเรียกเก็บเงินสำหรับ / Billed To). Return ONLY the name; omit any timezone prefix such as GMT+7, +12, GMT+12, etc.",
        },
        paymentSuccess: {
            type: SchemaType.BOOLEAN,
            description: "True if this receipt/invoice is for a successful payment (amount was charged). False if it is for a failed/unsuccessful payment (e.g. payment declined, unpaid, or explicitly marked as failed).",
        },
    },
    required: ["date", "card_last_4", "amount", "currency", "billed_to", "paymentSuccess"],
};

/** Strip timezone prefix (e.g. GMT+12, +7) from Billed To so we keep only the name. */
function normalizeBilledTo(raw: string): string {
    const s = (raw ?? "").trim();
    // Remove leading: optional "GMT", optional +/-, 1–2 digits, optional space
    return s.replace(/^\s*(?:GMT\s*)?[+-]?\d{1,2}\s*/i, "").trim();
}

/** Parse a number from text; supports "2.12", "2,120.50", "US$0.21". */
function parseAmount(raw: string): number {
    const n = Number(String(raw).replace(/,/g, "").trim());
    return Number.isNaN(n) ? 0 : n;
}

/**
 * If the receipt has "ยอดรวม: X USD" and "ภาษีมูลค่าเพิ่ม: US$Y", return X + Y (final total).
 * Otherwise returns 0 (not found).
 */
function subtotalPlusVatFromText(text: string): number {
    // ยอดรวม: 2.12 USD | ยอดรวม : 2.12 | Subtotal: 2.12 USD
    const subtotalMatch = text.match(/(?:ยอดรวม|Subtotal|subtotal)\s*:?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:USD|US\$|THB|฿)?/i);
    // ภาษีมูลค่าเพิ่ม: US$0.21 (อัตรา: 10%) | VAT: 0.21 | ภาษีมูลค่าเพิ่ม US$0.21
    const vatMatch = text.match(/(?:ภาษีมูลค่าเพิ่ม|VAT|tax)\s*:?\s*(?:US\$|USD|THB|฿)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
    const subtotal = subtotalMatch ? parseAmount(subtotalMatch[1]) : 0;
    const vat = vatMatch ? parseAmount(vatMatch[1]) : 0;
    if (subtotal > 0 && vat >= 0) return Math.round((subtotal + vat) * 100) / 100;
    return 0;
}

/**
 * Prefer the FINAL total: either the big displayed amount (e.g. US$2.33) or
 * ยอดรวม + ภาษีมูลค่าเพิ่ม when both are present in the text.
 */
function pickBestAmountFromText(pdfText: string, baseAmount: number, currencyHint?: string): number {
    const text = (pdfText ?? "").slice(0, 8000);
    if (!text) return baseAmount;

    // Strategy 1: ยอดรวม + ภาษีมูลค่าเพิ่ม = total (e.g. 2.12 + 0.21 = 2.33)
    const subtotalPlusVat = subtotalPlusVatFromText(text);

    // Strategy 2: find all currency amounts and take the largest (the "big" total like US$2.33)
    const currencyTokens = [
        "USD",
        "US\\$",
        "THB",
        "฿",
        "EUR",
        "€",
        "JPY",
        "¥",
        "IDR",
        "SGD",
        "MYR",
        "RM",
    ];
    const hint = (currencyHint || "").toUpperCase();
    const filteredTokens = hint
        ? currencyTokens.filter((t) => t.replace(/\\W/g, "") === hint || t.toUpperCase() === hint)
        : currencyTokens;
    const tokenGroup = filteredTokens.length ? filteredTokens.join("|") : currencyTokens.join("|");
    const pattern1 = new RegExp(`(?:${tokenGroup})\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)`, "gi");
    const pattern2 = new RegExp(`([0-9][0-9,]*(?:\\.[0-9]{1,2})?)\\s*(?:${tokenGroup})`, "gi");
    const amounts: number[] = [];
    const collect = (regex: RegExp) => {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            const num = parseAmount(match[1]);
            if (num > 0) amounts.push(num);
        }
    };
    collect(pattern1);
    collect(pattern2);
    const maxSingleAmount = amounts.length ? Math.max(...amounts) : 0;

    // Best candidate = largest of: (subtotal+VAT), (big single amount), (AI base)
    const candidates = [baseAmount, subtotalPlusVat, maxSingleAmount].filter((n) => n > 0);
    if (!candidates.length) return baseAmount;
    let best = Math.max(...candidates);
    // Avoid wild OCR numbers: cap at 5x base if base was set
    if (baseAmount > 0 && best > baseAmount * 5) best = baseAmount;
    return best;
}

/**
 * Heuristic check on the raw PDF text to decide if this invoice is
 * clearly unsuccessful. This helps correct cases where the AI might
 * mis-classify paymentSuccess.
 *
 * Strategy:
 * - If we see strong failure keywords (TH/EN) → treat as failed.
 * - If we see explicit success words but no failure keywords → treat as success.
 * - Otherwise → return null and let the AI's paymentSuccess stand.
 */
function detectPaymentSuccessFromText(pdfText: string): boolean | null {
    const text = (pdfText ?? "").toLowerCase();
    if (!text) return null;

    // Normalize some Thai characters that often get weird in OCR (optional, lightweight)
    const norm = text.normalize("NFC");

    const failedKeywords = [
        "ไม่สำเร็จ",
        "ไม่ส\u0e33เร็จ",
        "ไม่ ส\u0e33เร็จ",
        "unsuccessful",
        "payment unsuccessful",
        "failed payment",
        "payment failed",
        "declined",
        "wasn't completed",
        "not completed",
    ];

    for (const k of failedKeywords) {
        if (norm.includes(k.toLowerCase())) {
            return false;
        }
    }

    const successKeywords = [
        "ชำระเงินสำเร็จ",
        "ทำรายการสำเร็จ",
        "ชำระเงินแล้ว",
        "ชำระ แล้ว",
        "successful payment",
        "payment successful",
        "payment completed",
        "paid",
    ];

    for (const k of successKeywords) {
        if (norm.includes(k.toLowerCase())) {
            return true;
        }
    }

    return null;
}

export async function extractInvoiceData(pdfText: string): Promise<InvoiceData> {
    // Truncate to first 3000 chars — key info in Facebook PDF is always near the top
    const trimmedText = pdfText.slice(0, 3000);

    const model = ai.getGenerativeModel({
        model: "gemini-2.0-flash", // Free tier is 1,500 requests per day!
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: invoiceSchema,
            temperature: 0, // Deterministic, no hallucination
        },
    });

    const prompt = `Extract the exact payment information from this Facebook Ads billing receipt.

Rules:
- If a value is truly missing, return an empty string or 0.
- For "billed_to": return ONLY the person or company name. If the PDF shows a timezone prefix (e.g. "GMT+12", "+7", "GMT+7") before the name, omit it and return just the name (e.g. "Yanto Rahim" not "GMT+12 Yanto Rahim").
- For "paymentSuccess": set true if the receipt is for a successful payment (amount charged); set false if the payment failed, was declined, or is marked as unsuccessful.
- For "amount": use ONLY the final total amount that was actually charged/paid (the amount debited from the card). This must INCLUDE VAT, tax, and any fees. If you see both a subtotal (e.g. 20.00) and a total including VAT (e.g. 20.20), you MUST return the total (20.20), not the subtotal. Prefer fields labeled "Total", "Amount paid", "Total charged", "Amount due", or the final sum after adding tax/VAT). On Meta/Facebook Thai receipts, prefer the big US$ amount on the right (e.g. "US$2.33") instead of the smaller "ยอดรวม" subtotal line (e.g. "ยอดรวม: 2.12 USD" plus separate VAT).

--- RECEIPT TEXT ---
${trimmedText}`;

    try {
        const result = await model.generateContent(prompt);
        const responseJson = result.response.text();
        const parsed = JSON.parse(responseJson) as InvoiceData;

        const baseAmount = Number(parsed.amount) || 0;
        const finalAmount = pickBestAmountFromText(pdfText, baseAmount, parsed.currency);

        // Start from model's decision, but let our text heuristic override when confident.
        let paymentSuccess = Boolean(parsed.paymentSuccess !== false);
        const detected = detectPaymentSuccessFromText(pdfText);
        if (detected !== null) {
            paymentSuccess = detected;
        }

        return {
            date: parsed.date ?? "",
            card_last_4: parsed.card_last_4?.replace(/\D/g, "").slice(-4) ?? "",
            amount: finalAmount,
            currency: parsed.currency ?? "USD",
            billed_to: normalizeBilledTo(parsed.billed_to ?? ""),
            paymentSuccess,
        };
    } catch (err) {
        console.error("Gemini Extraction Error:", err);
        return { date: "", card_last_4: "", amount: 0, currency: "USD", billed_to: "", paymentSuccess: true };
    }
}
