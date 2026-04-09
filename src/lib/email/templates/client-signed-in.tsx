import * as React from "react";
import { EmailLayout, BRAND, Heading, Text } from "./layout";

interface ClientSignedInEmailProps {
  clientUserName: string;
  clientUserEmail: string;
  clientName: string;
  portalUrl: string;
}

export function ClientSignedInEmail({
  clientUserName,
  clientUserEmail,
  clientName,
  portalUrl,
}: ClientSignedInEmailProps) {
  return (
    <EmailLayout
      previewText={`${clientUserName} just signed in to ${clientName}'s portal`}
      ctaUrl={portalUrl}
      ctaLabel="Open Portal"
    >
      <Heading style={heading}>New Client Sign-In</Heading>
      <Text style={message}>
        <strong>{clientUserName}</strong> ({clientUserEmail}) just signed in to
        the <strong>{clientName}</strong> portal for the first time.
      </Text>
      <Text style={hint}>
        They can now view requests, leave comments, and download deliverables.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 16px",
};

const message: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const hint: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "20px",
  margin: 0,
};

ClientSignedInEmail.PreviewProps = {
  clientUserName: "Lorena Afane",
  clientUserEmail: "lorena@savemydish.com",
  clientName: "Save My Dish",
  portalUrl: "https://vimistudio.com/portal/admin",
} satisfies ClientSignedInEmailProps;
