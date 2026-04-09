import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";

interface DeliverableUploadedEmailProps {
  requestTitle: string;
  requestUrl: string;
  uploaderName: string;
  fileNames: string[];
  fileCount: number;
}

export function DeliverableUploadedEmail({
  requestTitle,
  requestUrl,
  uploaderName,
  fileNames,
  fileCount,
}: DeliverableUploadedEmailProps) {
  const displayFiles = fileNames.slice(0, 5);
  const remaining = fileCount - displayFiles.length;

  return (
    <EmailLayout
      previewText={`New files for "${requestTitle}"`}
      ctaUrl={requestUrl}
      ctaLabel="View Files"
    >
      <Heading style={heading}>
        {fileCount === 1 ? "New File Uploaded" : `${fileCount} New Files`}
      </Heading>
      <Text style={meta}>{requestTitle}</Text>

      <Section style={fileList}>
        <Text style={uploaderStyle}>
          Uploaded by {uploaderName}
        </Text>
        {displayFiles.map((name, i) => (
          <Text key={i} style={fileName}>
            📎 {name}
          </Text>
        ))}
        {remaining > 0 && (
          <Text style={moreFiles}>+{remaining} more file{remaining > 1 ? "s" : ""}</Text>
        )}
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
