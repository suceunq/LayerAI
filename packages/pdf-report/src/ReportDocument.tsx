import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportData } from "./types.js";
import { RISK_LABELS_FR } from "./risk-labels.js";

const ORANGE = "#FF6600";
const DARK = "#1a1a1d";
const GRAY = "#6b6b73";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: DARK },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  brand: { fontSize: 20, fontWeight: 700 },
  brandAccent: { color: ORANGE },
  meta: { fontSize: 9, color: GRAY, marginBottom: 16 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingBottom: 3 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 140, color: GRAY },
  value: { flex: 1 },
  paramRow: { flexDirection: "row", marginBottom: 6, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#eeeeee" },
  paramKey: { width: 140, fontFamily: "Courier" },
  paramValue: { width: 60, fontFamily: "Courier", color: ORANGE },
  paramWhy: { flex: 1, color: GRAY, fontSize: 9 },
  riskRow: { marginBottom: 4 },
  riskTitle: { fontWeight: 700 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: GRAY, textAlign: "center" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statBox: { width: "30%", marginBottom: 8 },
  statLabel: { color: GRAY, fontSize: 9 },
  statValue: { fontSize: 13, fontWeight: 700 },
});

function SectionTitle({ children }: { children: string }): React.JSX.Element {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function ReportDocument({ data }: { data: ReportData }): React.JSX.Element {
  const { fileName, printer, filament, analysis, config, explanations, comparison, generatedAt } = data;

  const costPerKg = filament.costPerKg ?? 0;
  const estimatedCost = (comparison.aiFilamentG / 1000) * costPerKg;

  return (
    <Document title={`Rapport LayerAI - ${fileName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            Layer<Text style={styles.brandAccent}>AI</Text>
          </Text>
          <Text style={styles.meta}>{new Date(generatedAt).toLocaleString("fr-FR")}</Text>
        </View>
        <Text style={styles.meta}>
          {fileName} — {printer.name} / {filament.name}
        </Text>

        <View style={styles.section}>
          <SectionTitle>Résumé</SectionTitle>
          <Text>{explanations.summary}</Text>
        </View>

        <View style={styles.section}>
          <SectionTitle>Estimations</SectionTitle>
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Temps estimé</Text>
              <Text style={styles.statValue}>{comparison.aiEstimatedTimeMin.toFixed(0)} min</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Poids / consommation</Text>
              <Text style={styles.statValue}>{comparison.aiFilamentG.toFixed(1)} g</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Coût matière estimé</Text>
              <Text style={styles.statValue}>{estimatedCost > 0 ? `${estimatedCost.toFixed(2)} €` : "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Analyse du modèle</SectionTitle>
          <View style={styles.row}>
            <Text style={styles.label}>Dimensions</Text>
            <Text style={styles.value}>
              {analysis.dimensionsMm.x.toFixed(1)} × {analysis.dimensionsMm.y.toFixed(1)} × {analysis.dimensionsMm.z.toFixed(1)} mm
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Volume</Text>
            <Text style={styles.value}>{(analysis.volumeMm3 / 1000).toFixed(1)} cm³</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Triangles</Text>
            <Text style={styles.value}>{analysis.triangleCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Confiance de l'analyse</Text>
            <Text style={styles.value}>{Math.round(analysis.analysisConfidence * 100)}%</Text>
          </View>
        </View>

        {analysis.riskFlags.length > 0 && (
          <View style={styles.section}>
            <SectionTitle>Problèmes détectés et corrections proposées</SectionTitle>
            {analysis.riskFlags.map((flag) => (
              <View key={flag.id} style={styles.riskRow}>
                <Text style={styles.riskTitle}>
                  {RISK_LABELS_FR[flag.id]} ({flag.severity === "high" ? "élevé" : "modéré"})
                </Text>
                <Text style={styles.paramWhy}>{flag.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section} break={Object.keys(config).length > 10}>
          <SectionTitle>Réglages appliqués</SectionTitle>
          {explanations.parameters.map((p) => (
            <View key={p.parameterKey} style={styles.paramRow}>
              <Text style={styles.paramKey}>{p.parameterKey}</Text>
              <Text style={styles.paramValue}>{p.valueLabel}</Text>
              <Text style={styles.paramWhy}>
                {p.whyText} ({p.confidencePercent}%)
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle>Recommandations</SectionTitle>
          {analysis.riskFlags.length === 0 && <Text>Aucun point d'attention particulier détecté sur ce modèle.</Text>}
          {analysis.riskFlags.map((flag) => (
            <Text key={flag.id} style={{ marginBottom: 3 }}>
              • {RISK_LABELS_FR[flag.id]} : {flag.description}
            </Text>
          ))}
        </View>

        <Text style={styles.footer}>
          Rapport généré automatiquement par LayerAI. Les temps, poids et coûts sont des estimations indicatives et ne remplacent pas le
          calcul réel effectué par PrusaSlicer lors du tranchage.
        </Text>
      </Page>
    </Document>
  );
}
