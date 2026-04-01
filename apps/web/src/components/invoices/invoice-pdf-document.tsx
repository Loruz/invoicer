import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency } from "@invoicer/shared";
import type { InvoiceTemplate } from "@invoicer/shared";
import { DEFAULT_INVOICE_TEMPLATE } from "@invoicer/shared";

type InvoicePdfProps = {
  invoice: {
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date | null;
    status: string;
    currency: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    total: number;
    notes: string | null;
    paymentTerms: string | null;
    client: {
      companyName: string;
      contactName: string | null;
      address: string | null;
      city: string | null;
      country: string | null;
      postalCode: string | null;
      email: string | null;
      phone?: string | null;
      taxId: string | null;
    };
    lineItems: Array<{
      description: string;
      quantity: string | number;
      unitPrice: number;
      taxRate: string | number;
      taxAmount: number;
      amount: number;
      sortOrder: number;
    }>;
    discounts: Array<{
      description: string;
      type: string;
      value: string | number;
      amount: number;
    }>;
  };
  user: {
    name: string | null;
    businessName: string | null;
    businessAddress: string | null;
    businessEmail: string | null;
    businessPhone: string | null;
    businessEntity: string | null;
    taxId: string | null;
    companyCode: string | null;
    bankName: string | null;
    bankCode: string | null;
    bankSwift: string | null;
    bankAccount: string | null;
  };
  template?: InvoiceTemplate | null;
};

const GRAY = "#6b7280";
const LIGHT_GRAY = "#9ca3af";
const DARK = "#111827";
const BORDER = "#e5e7eb";
const LIGHT_BORDER = "#f1f5f9";

const FONT_MAP: Record<string, string> = {
  default: "Inter",
  serif: "Noto Serif",
  mono: "Roboto Mono",
};

// With registered fonts, bold is handled via fontWeight, not a separate family.
// We keep this map for the StyleSheet fontFamily value (same family name).
const FONT_BOLD_MAP: Record<string, string> = {
  default: "Inter",
  serif: "Noto Serif",
  mono: "Roboto Mono",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildClientAddress(client: InvoicePdfProps["invoice"]["client"]): string {
  const parts: string[] = [];
  if (client.address) parts.push(client.address);
  const cityLine = [client.city, client.postalCode].filter(Boolean).join(" ");
  if (cityLine) parts.push(cityLine);
  if (client.country) parts.push(client.country);
  return parts.join(", ");
}

// ─── Shared PDF sub-components ──────────────────────────────────────────────

type PdfUser = InvoicePdfProps["user"];
type PdfInvoice = InvoicePdfProps["invoice"];

function SellerBankDetails({
  user,
  t,
  style,
}: {
  user: PdfUser;
  t: InvoiceTemplate;
  style: ReturnType<typeof StyleSheet.create>;
}) {
  if (!t.showBankDetails || (!user.bankName && !user.bankAccount)) return null;
  return (
    <View style={{ marginTop: 6 }}>
      {user.bankName && (
        <Text style={style.businessDetail}>Bankas: {user.bankName}</Text>
      )}
      {user.bankCode && (
        <Text style={style.businessDetail}>Banko kodas: {user.bankCode}</Text>
      )}
      {user.bankSwift && (
        <Text style={style.businessDetail}>SWIFT: {user.bankSwift}</Text>
      )}
      {user.bankAccount && (
        <Text style={style.businessDetail}>Sąskaita: {user.bankAccount}</Text>
      )}
    </View>
  );
}

function TotalsBlock({
  invoice,
  styles,
}: {
  invoice: PdfInvoice;
  styles: {
    totalsContainer: any;
    totalsBox: any;
    totalsRow: any;
    totalsLabel: any;
    totalsValue: any;
    totalsDivider: any;
    grandTotalRow: any;
    grandTotalLabel: any;
    grandTotalValue: any;
  };
}) {
  return (
    <View style={styles.totalsContainer}>
      <View style={styles.totalsBox}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Tarpinė suma</Text>
          <Text style={styles.totalsValue}>
            {formatCurrency(invoice.subtotal, invoice.currency)}
          </Text>
        </View>
        {invoice.taxTotal > 0 && (
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>PVM</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.taxTotal, invoice.currency)}
            </Text>
          </View>
        )}
        {invoice.discountTotal > 0 && (
          <>
            <View style={styles.totalsDivider} />
            {invoice.discounts.map((discount, i) => (
              <View key={i} style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  {discount.description} (
                  {discount.type === "percentage"
                    ? `${discount.value}%`
                    : formatCurrency(Number(discount.value), invoice.currency)}
                  )
                </Text>
                <Text style={styles.totalsValue}>
                  -{formatCurrency(discount.amount, invoice.currency)}
                </Text>
              </View>
            ))}
          </>
        )}
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>Viso</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(invoice.total, invoice.currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Classic Layout ─────────────────────────────────────────────────────────

function makeClassicStyles(t: InvoiceTemplate) {
  const font = FONT_MAP[t.fontFamily] ?? "Helvetica";
  const fontBold = FONT_BOLD_MAP[t.fontFamily] ?? "Helvetica-Bold";
  const lightBg = t.primaryColor + "10";

  return StyleSheet.create({
    page: {
      fontFamily: font,
      fontSize: 10,
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 40,
      color: DARK,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    headerLeft: {
      flexDirection: "column",
      maxWidth: "60%",
    },
    businessName: {
      fontSize: 20,
      fontFamily: fontBold, fontWeight: 700,
      color: t.primaryColor,
      marginBottom: 4,
    },
    businessDetail: {
      fontSize: 9,
      color: GRAY,
      marginBottom: 2,
    },
    headerRight: {
      flexDirection: "column",
      alignItems: "flex-end",
    },
    invoiceTitle: {
      fontSize: 24,
      fontFamily: fontBold, fontWeight: 700,
      color: t.primaryColor,
      marginBottom: 6,
    },
    invoiceDetail: {
      fontSize: 9,
      color: GRAY,
      marginBottom: 2,
      textAlign: "right",
    },
    invoiceDetailValue: {
      fontFamily: fontBold, fontWeight: 700,
      color: DARK,
    },
    divider: {
      height: 2,
      backgroundColor: t.primaryColor,
      marginBottom: 20,
    },
    billToSection: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 8,
      fontFamily: fontBold, fontWeight: 700,
      color: t.primaryColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    clientName: {
      fontSize: 12,
      fontFamily: fontBold, fontWeight: 700,
      marginBottom: 3,
    },
    clientDetail: {
      fontSize: 9,
      color: GRAY,
      marginBottom: 2,
    },
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: t.primaryColor,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 2,
    },
    tableHeaderText: {
      fontSize: 8,
      fontFamily: fontBold, fontWeight: 700,
      color: "#ffffff",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    tableRowAlt: {
      backgroundColor: lightBg,
    },
    colNum: { width: "6%" },
    colDesc: { width: "34%" },
    colQty: { width: "12%", textAlign: "right" },
    colPrice: { width: "16%", textAlign: "right" },
    colTax: { width: "14%", textAlign: "right" },
    colAmount: { width: "18%", textAlign: "right" },
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 24,
    },
    totalsBox: {
      width: 220,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    totalsLabel: {
      fontSize: 9,
      color: GRAY,
    },
    totalsValue: {
      fontSize: 9,
      fontFamily: fontBold, fontWeight: 700,
    },
    totalsDivider: {
      height: 1,
      backgroundColor: BORDER,
      marginVertical: 2,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: t.accentColor,
      borderRadius: 2,
      marginTop: 4,
    },
    grandTotalLabel: {
      fontSize: 11,
      fontFamily: fontBold, fontWeight: 700,
      color: "#ffffff",
    },
    grandTotalValue: {
      fontSize: 11,
      fontFamily: fontBold, fontWeight: 700,
      color: "#ffffff",
    },
    notesSection: {
      marginBottom: 16,
    },
    notesText: {
      fontSize: 9,
      color: GRAY,
      lineHeight: 1.5,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 8,
      color: GRAY,
      borderTopWidth: 1,
      borderTopColor: BORDER,
      paddingTop: 8,
    },
  });
}

function ClassicPdf({
  invoice,
  user,
  t,
}: {
  invoice: PdfInvoice;
  user: PdfUser;
  t: InvoiceTemplate;
}) {
  const styles = makeClassicStyles(t);
  const sortedItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.businessName}>
            {user.businessName || user.name || "Your Business"}
          </Text>
          {user.businessEntity && (
            <Text style={styles.businessDetail}>{user.businessEntity}</Text>
          )}
          {user.companyCode && (
            <Text style={styles.businessDetail}>
              Įmonės kodas: {user.companyCode}
            </Text>
          )}
          {t.showTaxId && user.taxId && (
            <Text style={styles.businessDetail}>PVM kodas: {user.taxId}</Text>
          )}
          {user.businessAddress && (
            <Text style={styles.businessDetail}>{user.businessAddress}</Text>
          )}
          {user.businessEmail && (
            <Text style={styles.businessDetail}>{user.businessEmail}</Text>
          )}
          {user.businessPhone && (
            <Text style={styles.businessDetail}>{user.businessPhone}</Text>
          )}
          <SellerBankDetails user={user} t={t} style={styles} />
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.invoiceTitle}>SĄSKAITA FAKTŪRA</Text>
          <Text style={styles.invoiceDetail}>
            <Text style={styles.invoiceDetailValue}>
              #{invoice.invoiceNumber}
            </Text>
          </Text>
          <Text style={styles.invoiceDetail}>
            Išrašymo data:{" "}
            <Text style={styles.invoiceDetailValue}>
              {formatDate(invoice.issueDate)}
            </Text>
          </Text>
          <Text style={styles.invoiceDetail}>
            Apmokėjimo data:{" "}
            <Text style={styles.invoiceDetailValue}>
              {formatDate(invoice.dueDate)}
            </Text>
          </Text>
          <Text style={styles.invoiceDetail}>
            Būsena:{" "}
            <Text style={styles.invoiceDetailValue}>
              {invoice.status.toUpperCase()}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bill To */}
      <View style={styles.billToSection}>
        <Text style={styles.sectionLabel}>Pirkėjas</Text>
        <Text style={styles.clientName}>{invoice.client.companyName}</Text>
        {invoice.client.contactName && (
          <Text style={styles.clientDetail}>{invoice.client.contactName}</Text>
        )}
        {buildClientAddress(invoice.client) && (
          <Text style={styles.clientDetail}>
            {buildClientAddress(invoice.client)}
          </Text>
        )}
        {invoice.client.email && (
          <Text style={styles.clientDetail}>{invoice.client.email}</Text>
        )}
        {invoice.client.taxId && (
          <Text style={styles.clientDetail}>
            PVM kodas: {invoice.client.taxId}
          </Text>
        )}
      </View>

      {/* Line Items */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Aprašymas
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Kiekis</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>
            Vnt. kaina
          </Text>
          <Text style={[styles.tableHeaderText, styles.colTax]}>PVM %</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Suma</Text>
        </View>
        {sortedItems.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
            ]}
          >
            <Text style={styles.colNum}>{index + 1}</Text>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>
              {formatCurrency(item.unitPrice, invoice.currency)}
            </Text>
            <Text style={styles.colTax}>{item.taxRate}%</Text>
            <Text style={styles.colAmount}>
              {formatCurrency(item.amount, invoice.currency)}
            </Text>
          </View>
        ))}
      </View>

      <TotalsBlock invoice={invoice} styles={styles} />

      {t.showNotes && invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Pastabos</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}
      {t.showPaymentTerms && invoice.paymentTerms && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Mokėjimo sąlygos</Text>
          <Text style={styles.notesText}>{invoice.paymentTerms}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        {t.footerText ||
          `${user.businessName || user.name || "Sąskaita"} - ${invoice.invoiceNumber} - Sugeneruota ${formatDate(new Date())}`}
      </Text>
    </Page>
  );
}

// ─── Modern Layout ──────────────────────────────────────────────────────────

function makeModernStyles(t: InvoiceTemplate) {
  const font = FONT_MAP[t.fontFamily] ?? "Helvetica";
  const fontBold = FONT_BOLD_MAP[t.fontFamily] ?? "Helvetica-Bold";

  return StyleSheet.create({
    page: {
      fontFamily: font,
      fontSize: 10,
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 40,
      color: DARK,
    },
    banner: {
      backgroundColor: t.primaryColor,
      borderRadius: 6,
      paddingVertical: 20,
      paddingHorizontal: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
    },
    bannerTitle: {
      fontSize: 22,
      fontFamily: fontBold, fontWeight: 700,
      color: "#ffffffE6",
    },
    bannerSubtitle: {
      fontSize: 10,
      color: "#ffffffB3",
      marginTop: 2,
    },
    bannerDate: {
      fontSize: 9,
      color: "#ffffffCC",
      textAlign: "right",
      marginBottom: 2,
    },
    columnsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    column: {
      width: "48%",
    },
    columnLabel: {
      fontSize: 8,
      fontFamily: fontBold, fontWeight: 700,
      color: LIGHT_GRAY,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    columnName: {
      fontSize: 11,
      fontFamily: fontBold, fontWeight: 700,
      marginBottom: 3,
    },
    businessDetail: {
      fontSize: 9,
      color: GRAY,
      marginBottom: 2,
    },
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: t.primaryColor,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 3,
    },
    tableHeaderText: {
      fontSize: 8,
      fontFamily: fontBold, fontWeight: 700,
      color: "#ffffff",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    tableRowAlt: {
      backgroundColor: "#f8fafc80",
    },
    colDesc: { width: "40%" },
    colQty: { width: "15%", textAlign: "right" },
    colPrice: { width: "20%", textAlign: "right" },
    colAmount: { width: "25%", textAlign: "right" },
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 24,
    },
    totalsBox: { width: 220 },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    totalsLabel: { fontSize: 9, color: GRAY },
    totalsValue: { fontSize: 9, fontFamily: fontBold, fontWeight: 700 },
    totalsDivider: {
      height: 1,
      backgroundColor: BORDER,
      marginVertical: 2,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: t.accentColor,
      borderRadius: 2,
      marginTop: 4,
    },
    grandTotalLabel: { fontSize: 11, fontFamily: fontBold, fontWeight: 700, color: "#ffffff" },
    grandTotalValue: { fontSize: 11, fontFamily: fontBold, fontWeight: 700, color: "#ffffff" },
    sectionLabel: {
      fontSize: 8,
      fontFamily: fontBold, fontWeight: 700,
      color: t.primaryColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    notesSection: { marginBottom: 16 },
    notesText: { fontSize: 9, color: GRAY, lineHeight: 1.5 },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 8,
      color: GRAY,
      borderTopWidth: 1,
      borderTopColor: BORDER,
      paddingTop: 8,
    },
  });
}

function ModernPdf({
  invoice,
  user,
  t,
}: {
  invoice: PdfInvoice;
  user: PdfUser;
  t: InvoiceTemplate;
}) {
  const styles = makeModernStyles(t);
  const sortedItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <Page size="A4" style={styles.page}>
      {/* Colored banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerTitle}>SĄSKAITA FAKTŪRA</Text>
          <Text style={styles.bannerSubtitle}>#{invoice.invoiceNumber}</Text>
        </View>
        <View>
          <Text style={styles.bannerDate}>
            Išrašyta: {formatDate(invoice.issueDate)}
          </Text>
          <Text style={styles.bannerDate}>
            Apmokėti iki: {formatDate(invoice.dueDate)}
          </Text>
        </View>
      </View>

      {/* From / To columns */}
      <View style={styles.columnsRow}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Pardavėjas</Text>
          <Text style={styles.columnName}>
            {user.businessName || user.name || "Your Business"}
          </Text>
          {user.businessEntity && (
            <Text style={styles.businessDetail}>{user.businessEntity}</Text>
          )}
          {user.companyCode && (
            <Text style={styles.businessDetail}>
              Įmonės kodas: {user.companyCode}
            </Text>
          )}
          {t.showTaxId && user.taxId && (
            <Text style={styles.businessDetail}>PVM kodas: {user.taxId}</Text>
          )}
          {user.businessAddress && (
            <Text style={styles.businessDetail}>{user.businessAddress}</Text>
          )}
          {user.businessEmail && (
            <Text style={styles.businessDetail}>{user.businessEmail}</Text>
          )}
          <SellerBankDetails user={user} t={t} style={styles} />
        </View>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Pirkėjas</Text>
          <Text style={styles.columnName}>
            {invoice.client.companyName}
          </Text>
          {invoice.client.contactName && (
            <Text style={styles.businessDetail}>
              {invoice.client.contactName}
            </Text>
          )}
          {invoice.client.email && (
            <Text style={styles.businessDetail}>{invoice.client.email}</Text>
          )}
          {buildClientAddress(invoice.client) && (
            <Text style={styles.businessDetail}>
              {buildClientAddress(invoice.client)}
            </Text>
          )}
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Aprašymas
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Kiekis</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Kaina</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Suma</Text>
        </View>
        {sortedItems.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              ...(index % 2 === 0 ? [styles.tableRowAlt] : []),
            ]}
          >
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>
              {formatCurrency(item.unitPrice, invoice.currency)}
            </Text>
            <Text style={styles.colAmount}>
              {formatCurrency(item.amount, invoice.currency)}
            </Text>
          </View>
        ))}
      </View>

      <TotalsBlock invoice={invoice} styles={styles} />

      {t.showPaymentTerms && invoice.paymentTerms && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Mokėjimo informacija</Text>
          <Text style={styles.notesText}>{invoice.paymentTerms}</Text>
        </View>
      )}
      {t.showNotes && invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Pastabos</Text>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        {t.footerText ||
          `${user.businessName || user.name || "Sąskaita"} - ${invoice.invoiceNumber} - Sugeneruota ${formatDate(new Date())}`}
      </Text>
    </Page>
  );
}

// ─── Minimal Layout ─────────────────────────────────────────────────────────

function makeMinimalStyles(t: InvoiceTemplate) {
  const font = FONT_MAP[t.fontFamily] ?? "Helvetica";
  const fontBold = FONT_BOLD_MAP[t.fontFamily] ?? "Helvetica-Bold";

  return StyleSheet.create({
    page: {
      fontFamily: font,
      fontSize: 10,
      paddingTop: 50,
      paddingBottom: 60,
      paddingHorizontal: 50,
      color: DARK,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 40,
    },
    accentBar: {
      height: 2,
      width: 40,
      backgroundColor: t.accentColor,
      borderRadius: 1,
      marginBottom: 16,
    },
    businessName: {
      fontSize: 11,
      fontFamily: fontBold, fontWeight: 700,
      marginBottom: 2,
    },
    businessDetail: {
      fontSize: 8,
      color: LIGHT_GRAY,
      marginBottom: 1.5,
    },
    headerRight: {
      alignItems: "flex-end",
    },
    invoiceLabel: {
      fontSize: 7,
      color: LIGHT_GRAY,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    invoiceNumber: {
      fontSize: 10,
      color: GRAY,
      marginTop: 2,
    },
    invoiceDate: {
      fontSize: 8,
      color: LIGHT_GRAY,
      marginTop: 8,
    },
    clientSection: {
      marginBottom: 30,
    },
    clientLabel: {
      fontSize: 8,
      color: LIGHT_GRAY,
      marginBottom: 4,
    },
    clientName: {
      fontSize: 10,
      color: DARK,
      marginBottom: 2,
    },
    clientDetail: {
      fontSize: 8,
      color: LIGHT_GRAY,
      marginBottom: 1.5,
    },
    table: {
      marginBottom: 24,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
      paddingBottom: 6,
    },
    tableHeaderText: {
      fontSize: 8,
      color: LIGHT_GRAY,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: LIGHT_BORDER,
    },
    colDesc: { width: "45%" },
    colQty: { width: "15%", textAlign: "right" },
    colPrice: { width: "20%", textAlign: "right" },
    colAmount: { width: "20%", textAlign: "right" },
    cellText: { fontSize: 9, color: "#334155" },
    cellTextLight: { fontSize: 9, color: LIGHT_GRAY },
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 30,
    },
    totalsBox: { width: 200 },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalsLabel: { fontSize: 8, color: LIGHT_GRAY },
    totalsValue: { fontSize: 8, color: GRAY },
    totalsDivider: {
      height: 1,
      backgroundColor: BORDER,
      marginVertical: 4,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: BORDER,
      paddingTop: 6,
      marginTop: 2,
    },
    grandTotalLabel: { fontSize: 10, color: "#334155" },
    grandTotalValue: { fontSize: 10, fontFamily: fontBold, fontWeight: 700, color: DARK },
    notesSection: { marginBottom: 12 },
    notesText: { fontSize: 8, color: LIGHT_GRAY, lineHeight: 1.5 },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 50,
      right: 50,
      textAlign: "center",
      fontSize: 7,
      color: "#cbd5e1",
    },
  });
}

function MinimalPdf({
  invoice,
  user,
  t,
}: {
  invoice: PdfInvoice;
  user: PdfUser;
  t: InvoiceTemplate;
}) {
  const styles = makeMinimalStyles(t);
  const sortedItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          {t.showLogo && <View style={styles.accentBar} />}
          <Text style={styles.businessName}>
            {user.businessName || user.name || "Your Business"}
          </Text>
          {user.businessEntity && (
            <Text style={styles.businessDetail}>{user.businessEntity}</Text>
          )}
          {user.companyCode && (
            <Text style={styles.businessDetail}>{user.companyCode}</Text>
          )}
          {t.showTaxId && user.taxId && (
            <Text style={styles.businessDetail}>{user.taxId}</Text>
          )}
          {user.businessAddress && (
            <Text style={styles.businessDetail}>{user.businessAddress}</Text>
          )}
          {user.businessEmail && (
            <Text style={styles.businessDetail}>{user.businessEmail}</Text>
          )}
          <SellerBankDetails user={user} t={t} style={styles} />
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.invoiceLabel}>Sąskaita faktūra</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.invoiceDate}>
            {formatDate(invoice.issueDate)}
          </Text>
          <Text style={styles.invoiceDate}>
            Apmokėti iki {formatDate(invoice.dueDate)}
          </Text>
        </View>
      </View>

      {/* Client */}
      <View style={styles.clientSection}>
        <Text style={styles.clientLabel}>Pirkėjas</Text>
        <Text style={styles.clientName}>{invoice.client.companyName}</Text>
        {invoice.client.email && (
          <Text style={styles.clientDetail}>{invoice.client.email}</Text>
        )}
        {buildClientAddress(invoice.client) && (
          <Text style={styles.clientDetail}>
            {buildClientAddress(invoice.client)}
          </Text>
        )}
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Aprašymas
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Kiekis</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Kaina</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Suma</Text>
        </View>
        {sortedItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colDesc]}>
              {item.description}
            </Text>
            <Text style={[styles.cellTextLight, styles.colQty]}>
              {item.quantity}
            </Text>
            <Text style={[styles.cellTextLight, styles.colPrice]}>
              {formatCurrency(item.unitPrice, invoice.currency)}
            </Text>
            <Text style={[styles.cellText, styles.colAmount]}>
              {formatCurrency(item.amount, invoice.currency)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tarpinė suma</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>
          {invoice.taxTotal > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>PVM</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.taxTotal, invoice.currency)}
              </Text>
            </View>
          )}
          {invoice.discountTotal > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Nuolaida</Text>
              <Text style={{ fontSize: 8, color: "#f87171" }}>
                -{formatCurrency(invoice.discountTotal, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Viso</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment / Notes */}
      {t.showPaymentTerms && invoice.paymentTerms && (
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>{invoice.paymentTerms}</Text>
        </View>
      )}
      {t.showNotes && invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>{invoice.notes}</Text>
        </View>
      )}

      {t.footerText && <Text style={styles.footer}>{t.footerText}</Text>}
    </Page>
  );
}

// ─── Formal Layout ──────────────────────────────────────────────────────────

function makeFormalStyles(t: InvoiceTemplate) {
  const font = FONT_MAP[t.fontFamily] ?? "Helvetica";
  const fontBold = FONT_BOLD_MAP[t.fontFamily] ?? "Helvetica-Bold";

  return StyleSheet.create({
    page: {
      fontFamily: font,
      fontSize: 10,
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 40,
      color: DARK,
    },
    centeredHeader: {
      alignItems: "center",
      marginBottom: 30,
    },
    title: {
      fontSize: 26,
      fontFamily: fontBold, fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 10,
    },
    headerDetail: {
      fontSize: 10,
      color: GRAY,
      marginBottom: 2,
    },
    columnsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    column: {
      width: "48%",
    },
    columnTitle: {
      fontSize: 12,
      fontFamily: fontBold, fontWeight: 700,
      marginBottom: 6,
    },
    businessDetail: {
      fontSize: 9,
      color: "#334155",
      marginBottom: 2,
    },
    table: {
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor: DARK,
      paddingBottom: 6,
    },
    tableHeaderText: {
      fontSize: 9,
      fontFamily: fontBold, fontWeight: 700,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    colDesc: { width: "40%" },
    colQty: { width: "15%", textAlign: "center" },
    colPrice: { width: "22%", textAlign: "right" },
    colAmount: { width: "23%", textAlign: "right" },
    cellText: { fontSize: 9, color: "#334155" },
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 12,
      marginBottom: 30,
    },
    totalsBox: { width: 200 },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalsLabel: { fontSize: 9, color: GRAY },
    totalsValue: { fontSize: 9 },
    totalsDivider: {
      height: 1,
      backgroundColor: BORDER,
      marginVertical: 2,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    grandTotalLabel: { fontSize: 10, fontFamily: fontBold, fontWeight: 700 },
    grandTotalValue: { fontSize: 10, fontFamily: fontBold, fontWeight: 700 },
    notesText: {
      fontSize: 9,
      color: GRAY,
      marginBottom: 20,
    },
    issuerLine: {
      fontSize: 9,
      color: GRAY,
      marginTop: 16,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 8,
      color: LIGHT_GRAY,
      borderTopWidth: 1,
      borderTopColor: BORDER,
      paddingTop: 8,
    },
  });
}

function FormalPdf({
  invoice,
  user,
  t,
}: {
  invoice: PdfInvoice;
  user: PdfUser;
  t: InvoiceTemplate;
}) {
  const styles = makeFormalStyles(t);
  const sortedItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <Page size="A4" style={styles.page}>
      {/* Centered header */}
      <View style={styles.centeredHeader}>
        <Text style={styles.title}>Sąskaita faktūra</Text>
        <Text style={styles.headerDetail}>
          Nr. {invoice.invoiceNumber}
        </Text>
        <Text style={styles.headerDetail}>
          Sąskaitos data {formatDate(invoice.issueDate)}
        </Text>
        {invoice.dueDate && (
          <Text style={styles.headerDetail}>
            Apmokėti iki {formatDate(invoice.dueDate)}
          </Text>
        )}
      </View>

      {/* Seller / Buyer */}
      <View style={styles.columnsRow}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Pardavėjas</Text>
          <Text style={styles.businessDetail}>
            {user.businessName || user.name || "Your Business"}
          </Text>
          {user.businessEntity && (
            <Text style={styles.businessDetail}>{user.businessEntity}</Text>
          )}
          {user.companyCode && (
            <Text style={styles.businessDetail}>
              Įmonės kodas: {user.companyCode}
            </Text>
          )}
          {t.showTaxId && user.taxId && (
            <Text style={styles.businessDetail}>PVM kodas: {user.taxId}</Text>
          )}
          {user.businessAddress && (
            <Text style={styles.businessDetail}>{user.businessAddress}</Text>
          )}
          {user.businessPhone && (
            <Text style={styles.businessDetail}>{user.businessPhone}</Text>
          )}
          {user.businessEmail && (
            <Text style={styles.businessDetail}>{user.businessEmail}</Text>
          )}
          <SellerBankDetails user={user} t={t} style={styles} />
          {t.showPaymentTerms && invoice.paymentTerms && (
            <Text style={[styles.businessDetail, { marginTop: 8 }]}>
              {invoice.paymentTerms}
            </Text>
          )}
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Pirkėjas</Text>
          <Text style={styles.businessDetail}>
            {invoice.client.companyName}
          </Text>
          {invoice.client.taxId && (
            <Text style={styles.businessDetail}>{invoice.client.taxId}</Text>
          )}
          {buildClientAddress(invoice.client) && (
            <Text style={styles.businessDetail}>
              {buildClientAddress(invoice.client)}
            </Text>
          )}
          {invoice.client.phone && (
            <Text style={styles.businessDetail}>{invoice.client.phone}</Text>
          )}
          {invoice.client.email && (
            <Text style={styles.businessDetail}>{invoice.client.email}</Text>
          )}
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Aprašymas
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Kiekis</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Kaina</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Suma</Text>
        </View>
        {sortedItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colDesc]}>
              {item.description}
            </Text>
            <Text style={[styles.cellText, styles.colQty]}>
              {item.quantity}
            </Text>
            <Text style={[styles.cellText, styles.colPrice]}>
              {formatCurrency(item.unitPrice, invoice.currency)}
            </Text>
            <Text style={[styles.cellText, styles.colAmount]}>
              {formatCurrency(item.amount, invoice.currency)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          {(invoice.taxTotal > 0 || invoice.discountTotal > 0) && (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tarpinė suma</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </Text>
              </View>
              {invoice.taxTotal > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>PVM</Text>
                  <Text style={styles.totalsValue}>
                    {formatCurrency(invoice.taxTotal, invoice.currency)}
                  </Text>
                </View>
              )}
              {invoice.discountTotal > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Nuolaida</Text>
                  <Text style={{ fontSize: 9, color: "#dc2626" }}>
                    -{formatCurrency(invoice.discountTotal, invoice.currency)}
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Viso</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {t.showNotes && invoice.notes && (
        <Text style={styles.notesText}>{invoice.notes}</Text>
      )}

      {/* Issuer line */}
      <Text style={styles.issuerLine}>
        Sąskaitą išrašė: {user.name || user.businessName || "—"}
      </Text>

      {t.footerText && <Text style={styles.footer}>{t.footerText}</Text>}
    </Page>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────

export function InvoicePdfDocument({
  invoice,
  user,
  template: templateProp,
}: InvoicePdfProps) {
  const t = { ...DEFAULT_INVOICE_TEMPLATE, ...templateProp };

  return (
    <Document>
      {t.layout === "modern" && (
        <ModernPdf invoice={invoice} user={user} t={t} />
      )}
      {t.layout === "minimal" && (
        <MinimalPdf invoice={invoice} user={user} t={t} />
      )}
      {t.layout === "formal" && (
        <FormalPdf invoice={invoice} user={user} t={t} />
      )}
      {t.layout === "classic" && (
        <ClassicPdf invoice={invoice} user={user} t={t} />
      )}
    </Document>
  );
}
