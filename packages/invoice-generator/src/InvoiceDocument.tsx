import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceData } from "./types.js";
import { INVOICE_TEXT } from "./translations.js";

const ACCENT = "#2F80ED";
const DARK = "#1a1a1d";
const GRAY = "#6b6b73";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: DARK },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  brand: { fontSize: 20, fontWeight: 700 },
  brandAccent: { color: ACCENT },
  invoiceTitle: { fontSize: 16, fontWeight: 700, textAlign: "right" },
  invoiceMeta: { fontSize: 9, color: GRAY, textAlign: "right", marginTop: 2 },
  partiesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  partyBlock: { width: "48%" },
  partyLabel: { fontSize: 8, color: GRAY, textTransform: "uppercase", marginBottom: 3 },
  partyName: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  partyLine: { fontSize: 9, color: DARK, marginBottom: 1 },
  table: { marginTop: 8, marginBottom: 12 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: DARK, paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e5e5", paddingVertical: 4 },
  colDescription: { flex: 1 },
  colQuantity: { width: 60, textAlign: "right" },
  colUnitPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  headerCell: { fontSize: 8, color: GRAY, textTransform: "uppercase" },
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totalsLabel: { color: GRAY },
  totalsValueFinal: { fontSize: 12, fontWeight: 700 },
  legalSection: { marginTop: 24, fontSize: 8, color: GRAY, lineHeight: 1.4 },
  notesSection: { marginTop: 16, fontSize: 9 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 7, color: GRAY, textAlign: "center" },
});

function formatEuro(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale);
}

export function InvoiceDocument({ data }: { data: InvoiceData }): React.JSX.Element {
  const { invoiceNumber, invoiceDate, dueDate, company, client, lineItems, notes, language } = data;
  const text = INVOICE_TEXT[language];

  const totalHt = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceHt, 0);
  const vatAmount = company.vatApplicable ? totalHt * (company.vatRatePercent / 100) : 0;
  const totalTtc = totalHt + vatAmount;

  return (
    <Document title={`${text.invoice} ${invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            Layer<Text style={styles.brandAccent}>AI</Text>
          </Text>
          <View>
            <Text style={styles.invoiceTitle}>{text.invoice} {invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>{text.issueDate} : {formatDate(invoiceDate, text.locale)}</Text>
            <Text style={styles.invoiceMeta}>{text.dueDate} : {formatDate(dueDate, text.locale)}</Text>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{text.issuer}</Text>
            <Text style={styles.partyName}>{company.name}</Text>
            <Text style={styles.partyLine}>{company.addressLine1}</Text>
            {company.addressLine2 && <Text style={styles.partyLine}>{company.addressLine2}</Text>}
            <Text style={styles.partyLine}>
              {company.postalCode} {company.city}
            </Text>
            <Text style={styles.partyLine}>SIRET : {company.siret}</Text>
            {company.legalStatus === "societe" && company.rcsCity && <Text style={styles.partyLine}>RCS {company.rcsCity}</Text>}
            {company.legalStatus === "societe" && company.capitalSocial && (
              <Text style={styles.partyLine}>{text.shareCapital} : {company.capitalSocial}</Text>
            )}
            {company.vatApplicable && company.vatNumber && <Text style={styles.partyLine}>{text.vatNumber} : {company.vatNumber}</Text>}
            {company.email && <Text style={styles.partyLine}>{company.email}</Text>}
            {company.phone && <Text style={styles.partyLine}>{company.phone}</Text>}
          </View>

          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{text.client}</Text>
            <Text style={styles.partyName}>{client.name}</Text>
            <Text style={styles.partyLine}>{client.addressLine1}</Text>
            {client.addressLine2 && <Text style={styles.partyLine}>{client.addressLine2}</Text>}
            <Text style={styles.partyLine}>
              {client.postalCode} {client.city}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.headerCell]}>{text.description}</Text>
            <Text style={[styles.colQuantity, styles.headerCell]}>{text.quantity}</Text>
            <Text style={[styles.colUnitPrice, styles.headerCell]}>{text.unitPrice}</Text>
            <Text style={[styles.colTotal, styles.headerCell]}>{text.totalExVat}</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{formatEuro(item.unitPriceHt, text.locale)}</Text>
              <Text style={styles.colTotal}>{formatEuro(item.quantity * item.unitPriceHt, text.locale)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{text.totalExVat}</Text>
            <Text>{formatEuro(totalHt, text.locale)}</Text>
          </View>
          {company.vatApplicable ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{text.vat} ({company.vatRatePercent}%)</Text>
              <Text>{formatEuro(vatAmount, text.locale)}</Text>
            </View>
          ) : (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{text.vat}</Text>
              <Text>{text.vatExemption}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { borderTopWidth: 1, borderTopColor: DARK, paddingTop: 4, marginTop: 2 }]}>
            <Text style={styles.totalsValueFinal}>{text.totalIncVat}</Text>
            <Text style={styles.totalsValueFinal}>{formatEuro(totalTtc, text.locale)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notesSection}>
            <Text>{notes}</Text>
          </View>
        )}

        <View style={styles.legalSection}>
          <Text>{text.paymentTerms(company.paymentTermsDays, formatDate(dueDate, text.locale), company.iban)}</Text>
          <Text>{text.latePayment}</Text>
          <Text>{text.noDiscount}</Text>
        </View>

        <Text style={styles.footer}>
          {text.generatedBy}. {company.name} - SIRET {company.siret}.
        </Text>
      </Page>
    </Document>
  );
}
