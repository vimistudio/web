import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";

interface DirectionVotedEmailProps {
  requestTitle: string;
  requestUrl: string;
  voterName: string;
  directionLabel: string;
  comment?: string;
}

export function DirectionVotedEmail({
  requestTitle,
  requestUrl,
  voterName,
  directionLabel,
  comment,
}: DirectionVotedEmailProps) {
  return (
    <EmailLayout
      previewText={`${voterName} picked "${directionLabel}" for "${requestTitle}"`}
      ctaUrl={requestUrl}
      ctaLabel="View Request"
    >
      <Heading style={heading}>Direction Picked</Heading>
      <Text style={meta}>{requestTitle}</Text>

      <Section style={pickBox}>
        <Text style={pickLabel}>
          {voterName} picked
        </Text>
        <Text style={pickDirection}>{directionLabel}</Text>
        {comment && (
          <Text style={pickComment}>
            &ldquo;{comment}&rdquo;
          </Text>
        )}
      </Section>

      <Text style={changeText}>
        You can now start refining this direction. Head to the portal to see the
        full details and continue the conversation.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 4px",
};

const meta: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  margin: "0 0 24px",
};

const pickBox: React.CSSProperties = {
  backgroundColor: `${BRAND.primary}10`,
  border: `1px solid ${BRAND.primary}30`,
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const pickLabel: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  margin: "0 0 4px",
};

const pickDirection: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: BRAND.primary,
  margin: "0 0 8px",
};

const pickComment: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  fontStyle: "italic",
  margin: "8px 0 0",
};

const changeText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: 0,
};

DirectionVotedEmail.PreviewProps = {
  requestTitle: "Logo Design v2",
  requestUrl: "https://vimistudio.com/portal/requests/123",
  voterName: "Lorena Afane",
  directionLabel: "Direction B: Modern",
  comment: "me encanta los colores!",
} satisfies DirectionVotedEmailProps;
