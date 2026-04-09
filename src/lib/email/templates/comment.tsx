import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";

interface CommentAddedEmailProps {
  requestTitle: string;
  requestUrl: string;
  commenterName: string;
  commentBody: string;
  requestType: string;
}

export function CommentAddedEmail({
  requestTitle,
  requestUrl,
  commenterName,
  commentBody,
  requestType,
}: CommentAddedEmailProps) {
  const truncated =
    commentBody.length > 200
      ? commentBody.slice(0, 200) + "..."
      : commentBody;

  return (
    <EmailLayout
      previewText={`${commenterName} commented on "${requestTitle}"`}
      ctaUrl={requestUrl}
      ctaLabel="View Conversation"
    >
      <Heading style={heading}>New Comment</Heading>
      <Text style={meta}>
        {requestType} &middot; {requestTitle}
      </Text>
      <Section style={quoteBlock}>
        <Text style={commenterStyle}>{commenterName}</Text>
        <Text style={commentStyle}>{truncated}</Text>
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

const quoteBlock: React.CSSProperties = {
  borderLeft: `3px solid ${BRAND.primary}`,
  paddingLeft: "16px",
  margin: "0",
};

const commenterStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#111111",
  margin: "0 0 4px",
};

const commentStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: 0,
};

CommentAddedEmail.PreviewProps = {
  requestTitle: "Logo Design v2",
  requestUrl: "https://vimistudio.com/portal/requests/123",
  commenterName: "Carlos Romero",
  commentBody:
    "Looking great! I've made a few tweaks to the color palette. Can you take a look and let me know if you'd like any changes?",
  requestType: "Logo Design",
} satisfies CommentAddedEmailProps;
