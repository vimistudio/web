import * as React from "react";
import { EmailLayout, BRAND, Heading, Text } from "./layout";

interface TeamInviteEmailProps {
  inviterName: string;
  inviterEmail: string;
  invitedEmail: string;
  clientName: string;
  portalUrl: string;
}

export function TeamInviteEmail({
  inviterName,
  inviterEmail,
  invitedEmail,
  clientName,
  portalUrl,
}: TeamInviteEmailProps) {
  return (
    <EmailLayout
      previewText={`${inviterName} invited a teammate to ${clientName}`}
      ctaUrl={portalUrl}
      ctaLabel="Open Portal"
    >
      <Heading style={heading}>Client Invited a Teammate</Heading>
      <Text style={message}>
        <strong>{inviterName}</strong> ({inviterEmail}) invited{" "}
        <strong>{invitedEmail}</strong> to the <strong>{clientName}</strong>{" "}
        portal.
      </Text>
      <Text style={hint}>
        The invite email has been sent. They&apos;ll join {clientName} the first
        time they sign in with Google.
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

TeamInviteEmail.PreviewProps = {
  inviterName: "Chef Rodrigo",
  inviterEmail: "rodrigo@scarts.edu.sv",
  invitedEmail: "margarita@scarts.edu.sv",
  clientName: "SCARTS",
  portalUrl: "https://vimistudio.com/portal/admin",
} satisfies TeamInviteEmailProps;
