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
  };
  template?: InvoiceTemplate | null;
};

const GRAY = "#6b7280";
const DARK = "#111827";
const BORDER = "#e5e7eb";

const FONT_MAP: Record<string, string> = {
  default: "Helvetica",
  serif: "Times-Roman",
  mono: "Courier",
};

const FONT_BOLD_MAP: Record<string, string> = {
  default: "Helvetica-Bold",
  serif: "Times-Bold",
  mono: "Courier-Bold",
};

function makeStyles(t: InvoiceTemplate) {
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
      fontFamily: fontBold,
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
      fontFamily: fontBold,
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
      fontFamily: fontBold,
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
      fontFamily: fontBold,
      color: t.primaryColor,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    clientName: {
      fontSize: 12,
      fontFamily: fontBold,
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
      fontFamily: fontBold,
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
      fontFamily: fontBold,
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
      fontFamily: fontBold,
      color: "#ffffff",
    },
    grandTotalValue: {
      fontSize: 11,
      fontFamily: fontBold,
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

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
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

export function InvoicePdfDocument({ invoice, user, template: templateProp }: InvoicePdfProps) {
  const t = { ...DEFAULT_INVOICE_TEMPLATE, ...templateProp };
  const styles = makeStyles(t);

  const sortedItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <Document>
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
            {user.businessAddress && (
              <Text style={styles.businessDetail}>{user.businessAddress}</Text>
            )}
            {user.businessEmail && (
              <Text style={styles.businessDetail}>{user.businessEmail}</Text>
            )}
            {user.businessPhone && (
              <Text style={styles.businessDetail}>{user.businessPhone}</Text>
            )}
            {t.showTaxId && user.taxId && (
              <Text style={styles.businessDetail}>Tax ID: {user.taxId}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDetail}>
              <Text style={styles.invoiceDetailValue}>
                #{invoice.invoiceNumber}
              </Text>
            </Text>
            <Text style={styles.invoiceDetail}>
              Issue Date:{" "}
              <Text style={styles.invoiceDetailValue}>
                {formatDate(invoice.issueDate)}
              </Text>
            </Text>
            <Text style={styles.invoiceDetail}>
              Due Date:{" "}
              <Text style={styles.invoiceDetailValue}>
                {formatDate(invoice.dueDate)}
              </Text>
            </Text>
            <Text style={styles.invoiceDetail}>
              Status:{" "}
              <Text style={styles.invoiceDetailValue}>
                {invoice.status.toUpperCase()}
              </Text>
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billToSection}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.clientName}>{invoice.client.companyName}</Text>
          {invoice.client.contactName && (
            <Text style={styles.clientDetail}>
              {invoice.client.contactName}
            </Text>
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
              Tax ID: {invoice.client.taxId}
            </Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTax]}>
              Tax Rate
            </Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>
              Amount
            </Text>
          </View>

          {sortedItems.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, ...(index % 2 === 1 ? [styles.tableRowAlt] : [])]}
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

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </Text>
            </View>
            {invoice.taxTotal > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>
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
                        : formatCurrency(
                            Number(discount.value),
                            invoice.currency
                          )}
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
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.total, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {t.showNotes && invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Terms */}
        {t.showPaymentTerms && invoice.paymentTerms && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Payment Terms</Text>
            <Text style={styles.notesText}>{invoice.paymentTerms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {t.footerText ||
            `${user.businessName || user.name || "Invoice"} - ${invoice.invoiceNumber} - Generated on ${formatDate(new Date())}`}
        </Text>
      </Page>
    </Document>
  );
}
