import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split "ABC-00123" into prefix "ABC-" and numeric suffix with width 5. */
function parsePrefixAndNumericSuffix(
  invoiceNumber: string
): { prefix: string; width: number } | null {
  const trimmed = invoiceNumber.trim();
  const m = trimmed.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  const [, prefix, suffixDigits] = m;
  if (!prefix.length) return null;
  return { prefix, width: suffixDigits.length };
}

async function getDefaultYearPrefixedNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const [result] = await db
    .select({
      maxNum: sql<string>`MAX(CAST(SUBSTRING(${invoices.invoiceNumber} FROM ${prefix.length + 1}) AS INTEGER))`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        sql`${invoices.invoiceNumber} LIKE ${prefix + "%"}`
      )
    );

  const nextNum = (parseInt(result?.maxNum || "0", 10) || 0) + 1;
  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

/**
 * Next number in the same string series as `basedOnNumber` (same prefix before
 * trailing digits, same zero-pad width). Falls back to default INV-{year}-####.
 */
export async function getNextInvoiceNumber(
  userId: string,
  basedOnNumber?: string | null
): Promise<string> {
  const parsed =
    basedOnNumber && basedOnNumber.trim().length > 0
      ? parsePrefixAndNumericSuffix(basedOnNumber)
      : null;

  if (!parsed) {
    return getDefaultYearPrefixedNumber(userId);
  }

  const { prefix, width } = parsed;
  const suffixPattern = new RegExp(
    `^${escapeRegex(prefix)}(\\d+)$`
  );

  const rows = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        sql`${invoices.invoiceNumber} LIKE ${prefix + "%"}`
      )
    );

  let max = 0;
  for (const row of rows) {
    const m = row.invoiceNumber.match(suffixPattern);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }

  const next = max + 1;
  const nextStr = next.toString();
  const padWidth = Math.max(width, nextStr.length);
  return `${prefix}${nextStr.padStart(padWidth, "0")}`;
}
