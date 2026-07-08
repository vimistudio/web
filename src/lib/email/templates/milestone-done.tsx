import * as React from "react";
import { EmailLayout, BRAND, Heading, Text } from "./layout";

interface MilestoneDoneEmailProps {
  clientUserName: string;
  clientUserEmail: string;
  clientName: string;
  milestoneTitle: string;
  portalUrl: string;
}

export function MilestoneDoneEmail({
  clientUserName,
  clientUserEmail,
  clientName,
  milestoneTitle,
  portalUrl,
}: MilestoneDoneEmailProps) {
  return (
    <EmailLayout
      previewText={`${clientUserName} completed a plan item for ${clientName}`}
      ctaUrl={portalUrl}
      ctaLabel="Open Portal"
    >
      <Heading style={heading}>Client Checked Off a Plan Item</Heading>
      <Text style={message}>
        <strong>{clientUserName}</strong> ({clientUserEmail}) marked{" "}
        <strong>{milestoneTitle}</strong> as done in the{" "}
        <strong>{clientName}</strong> plan.
      </Text>
      <Text style={hint}>You&apos;re clear to keep the plan moving.</Text>
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

MilestoneDoneEmail.PreviewProps = {
  clientUserName: "Chef Rodrigo",
  clientUserEmail: "rodrigo@scarts.edu.sv",
  clientName: "SCARTS",
  milestoneTitle: "Share brand assets & access",
  portalUrl: "https://vimistudio.com/portal/admin",
} satisfies MilestoneDoneEmailProps;
