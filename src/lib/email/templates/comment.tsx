import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";
import type { Locale } from "@/lib/portal-strings";

interface CommentAddedEmailProps {
  requestTitle: string;
  requestUrl: string;
  commenterName: string;
  commentBody: string;
  requestType: string;
  locale?: Locale;
}

const STRINGS = {
  en: {
    preview: (name: string, title: string) => `${name} commented on "${title}"`,
    cta: "View Conversation",
    heading: "New Comment",
  },
  es: {
    preview: (name: string, title: string) => `${name} comentó en «${title}»`,
    cta: "Ver la conversación",
    heading: "Nuevo comentario",
  },
} as const;

export function CommentAddedEmail({
  requestTitle,
  requestUrl,
  commenterName,
  commentBody,
  requestType,
  locale = "en",
}: CommentAddedEmailProps) {
  const s = STRINGS[locale];
  const truncated =
    commentBody.length > 200
      ? commentBody.slice(0, 200) + "..."
      : commentBody;

  return (
    <EmailLayout
      previewText={s.preview(commenterName, requestTitle)}
      ctaUrl={requestUrl}
      ctaLabel={s.cta}
      locale={locale}
    >
      <Heading style={heading}>{s.heading}</Heading>
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
