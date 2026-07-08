import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";
import type { Locale } from "@/lib/portal-strings";

interface DeliverableUploadedEmailProps {
  requestTitle: string;
  requestUrl: string;
  uploaderName: string;
  fileNames: string[];
  fileCount: number;
  locale?: Locale;
}

const STRINGS = {
  en: {
    preview: (title: string) => `New files for "${title}"`,
    cta: "View Files",
    heading: (count: number) =>
      count === 1 ? "New File Uploaded" : `${count} New Files`,
    uploadedBy: (name: string) => `Uploaded by ${name}`,
    more: (n: number) => `+${n} more file${n > 1 ? "s" : ""}`,
  },
  es: {
    preview: (title: string) => `Nuevos archivos para «${title}»`,
    cta: "Ver los archivos",
    heading: (count: number) =>
      count === 1 ? "Nuevo archivo" : `${count} archivos nuevos`,
    uploadedBy: (name: string) => `Subido por ${name}`,
    more: (n: number) => `+${n} archivo${n > 1 ? "s" : ""} más`,
  },
} as const;

export function DeliverableUploadedEmail({
  requestTitle,
  requestUrl,
  uploaderName,
  fileNames,
  fileCount,
  locale = "en",
}: DeliverableUploadedEmailProps) {
  const s = STRINGS[locale];
  const displayFiles = fileNames.slice(0, 5);
  const remaining = fileCount - displayFiles.length;

  return (
    <EmailLayout
      previewText={s.preview(requestTitle)}
      ctaUrl={requestUrl}
      ctaLabel={s.cta}
      locale={locale}
    >
      <Heading style={heading}>{s.heading(fileCount)}</Heading>
      <Text style={meta}>{requestTitle}</Text>

      <Section style={fileList}>
        <Text style={uploaderStyle}>{s.uploadedBy(uploaderName)}</Text>
        {displayFiles.map((name, i) => (
          <Text key={i} style={fileName}>
            {name}
          </Text>
        ))}
        {remaining > 0 && <Text style={moreFiles}>{s.more(remaining)}</Text>}
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

const fileList: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  border: "1px solid #e5e7eb",
};

const uploaderStyle: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  margin: "0 0 12px",
};

const fileName: React.CSSProperties = {
  fontSize: "14px",
  color: "#111111",
  margin: "0 0 6px",
  lineHeight: "20px",
};

const moreFiles: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.primary,
  fontWeight: 500,
  margin: "8px 0 0",
};

DeliverableUploadedEmail.PreviewProps = {
  requestTitle: "Logo Design v2",
  requestUrl: "https://vimistudio.com/portal/requests/123",
  uploaderName: "Carlos Romero",
  fileNames: ["logo-final.svg", "logo-final.png", "brand-guidelines.pdf"],
  fileCount: 3,
} satisfies DeliverableUploadedEmailProps;
