import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";

interface InviteEmailProps {
  clientName: string;
  portalUrl: string;
  invitedByName: string;
}

export function InviteEmail({
  clientName,
  portalUrl,
  invitedByName,
}: InviteEmailProps) {
  return (
    <EmailLayout
      previewText={`${invitedByName} invited you to your ${clientName} design portal`}
      ctaUrl={portalUrl}
      ctaLabel="Sign In to Your Portal"
    >
      <Heading style={heading}>You&apos;re Invited</Heading>
      <Text style={welcome}>
        {invitedByName} has set up a design portal for{" "}
        <strong>{clientName}</strong> on Vimi Studio.
      </Text>

      <Section style={featureList}>
        <Text style={featureItem}>
          <span style={bullet}>&#x2713;</span> View your design requests and
          their progress
        </Text>
        <Text style={featureItem}>
          <span style={bullet}>&#x2713;</span> Leave feedback and comments
          directly on deliverables
        </Text>
        <Text style={featureItem}>
          <span style={bullet}>&#x2713;</span> Download final files when
          they&apos;re ready
        </Text>
        <Text style={featureItem}>
          <span style={bullet}>&#x2713;</span> Get notified when something
          needs your attention
        </Text>
      </Section>

      <Text style={signInNote}>
        Sign in with Google using this email address to get started.
      </Text>
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
