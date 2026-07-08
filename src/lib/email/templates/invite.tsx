import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";
import type { Locale } from "@/lib/portal-strings";

interface InviteEmailProps {
  clientName: string;
  portalUrl: string;
  invitedByName: string;
  locale?: Locale;
}

const STRINGS = {
  en: {
    preview: (by: string, client: string) =>
      `${by} invited you to your ${client} design portal`,
    cta: "Sign In to Your Portal",
    heading: "You're Invited",
    welcome: (by: string) => `${by} has set up a design portal for`,
    onVimi: "on Vimi Studio.",
    features: [
      "View your design requests and their progress",
      "Leave feedback and comments directly on deliverables",
      "Download final files when they're ready",
      "Get notified when something needs your attention",
    ],
    signInNote: "Sign in with Google using this email address to get started.",
  },
  es: {
    preview: (by: string, client: string) =>
      `${by} te invitó a tu portal de diseño de ${client}`,
    cta: "Entrar a tu portal",
    heading: "Te invitamos",
    welcome: (by: string) => `${by} creó un portal de diseño para`,
    onVimi: "en Vimi Studio.",
    features: [
      "Mira tus solicitudes de diseño y su avance",
      "Deja comentarios directamente sobre las entregas",
      "Descarga los archivos finales cuando estén listos",
      "Recibe avisos cuando algo necesite tu atención",
    ],
    signInNote:
      "Inicia sesión con Google usando este correo para empezar.",
  },
} as const;

export function InviteEmail({
  clientName,
  portalUrl,
  invitedByName,
  locale = "en",
}: InviteEmailProps) {
  const s = STRINGS[locale];
  return (
    <EmailLayout
      previewText={s.preview(invitedByName, clientName)}
      ctaUrl={portalUrl}
      ctaLabel={s.cta}
      locale={locale}
    >
      <Heading style={heading}>{s.heading}</Heading>
      <Text style={welcome}>
        {s.welcome(invitedByName)} <strong>{clientName}</strong> {s.onVimi}
      </Text>

      <Section style={featureList}>
        {s.features.map((feature, i) => (
          <Text key={i} style={featureItem}>
            <span style={bullet}>&#x2713;</span> {feature}
          </Text>
        ))}
      </Section>

      <Text style={signInNote}>{s.signInNote}</Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 16px",
};

const welcome: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const featureList: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px 24px",
  border: "1px solid #e5e7eb",
  margin: "0 0 24px",
};

const featureItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "20px",
  margin: "0 0 10px",
};

const bullet: React.CSSProperties = {
  color: BRAND.primary,
  fontWeight: 600,
  marginRight: "8px",
};

const signInNote: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "20px",
  margin: 0,
};

InviteEmail.PreviewProps = {
  clientName: "Save My Dish",
  portalUrl: "https://vimistudio.com/portal/login",
  invitedByName: "Carlos Romero",
} satisfies InviteEmailProps;
