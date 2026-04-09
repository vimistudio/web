import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";

interface RequestCreatedEmailProps {
  requestTitle: string;
  requestUrl: string;
  clientName: string;
  requestType: string;
  priority: string;
  description?: string;
}

export function RequestCreatedEmail({
  requestTitle,
  requestUrl,
  clientName,
  requestType,
  priority,
  description,
}: RequestCreatedEmailProps) {
  const truncated = description
    ? description.length > 150
      ? description.slice(0, 150) + "..."
      : description
    : null;

  return (
    <EmailLayout
      previewText={`New request from ${clientName}: "${requestTitle}"`}
      ctaUrl={requestUrl}
      ctaLabel="View Request"
    >
      <Heading style={heading}>New Request</Heading>
      <Text style={meta}>
        {clientName} &middot; {requestType}
      </Text>

      <Section style={card}>
        <Text style={titleStyle}>{requestTitle}</Text>
        <div style={badges}>
          <span style={badge}>{requestType}</span>
          <span style={badge}>{priority}</span>
        </div>
        {truncated && <Text style={desc}>{truncated}</Text>}
      </Section>
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
  margin: "0 0 20px",
};

const card: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  border: "1px solid #e5e7eb",
};

const titleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 8px",
};

const badges: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  marginBottom: "10px",
};

const badge: React.CSSProperties = {
  fontSize: "11px",
  color: BRAND.muted,
  backgroundColor: "#e5e7eb",
  padding: "2px 8px",
  borderRadius: "4px",
};

const desc: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  lineHeight: "20px",
  margin: 0,
};

RequestCreatedEmail.PreviewProps = {
  requestTitle: "Instagram Story Templates",
  requestUrl: "https://vimistudio.com/portal/requests/123",
  clientName: "Save My Dish",
  requestType: "Social Media",
  priority: "This Week",
  description:
    "I need 3 Instagram story templates for our weekly specials. Warm, appetizing vibe. Brand colors.",
} satisfies RequestCreatedEmailProps;
