import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";

interface StatusChangedEmailProps {
  requestTitle: string;
  requestUrl: string;
  oldStatus: string;
  newStatus: string;
  changedByName: string;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "Up Next",
  in_progress: "In Progress",
  review: "Ready for You",
  done: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  queued: "#9ca3af",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#10b981",
};

function getCta(newStatus: string) {
  if (newStatus === "review") return "See Your Designs";
  if (newStatus === "done") return "Download Your Designs";
  return "View Request";
}

export function StatusChangedEmail({
  requestTitle,
  requestUrl,
  oldStatus,
  newStatus,
  changedByName,
}: StatusChangedEmailProps) {
  const steps = ["queued", "in_progress", "review", "done"];
  const currentIndex = steps.indexOf(newStatus);

  return (
    <EmailLayout
      previewText={`"${requestTitle}" moved to ${STATUS_LABELS[newStatus] || newStatus}`}
      ctaUrl={requestUrl}
      ctaLabel={getCta(newStatus)}
    >
      <Heading style={heading}>
        {newStatus === "in_progress"
          ? "Your Designer Started Working"
          : newStatus === "review"
            ? "Your Designs Are Ready for Review"
            : newStatus === "done"
              ? "Your Designs Have Been Delivered"
              : "Status Updated"}
      </Heading>
      <Text style={meta}>{requestTitle}</Text>

      {/* Status stepper */}
      <Section style={stepperContainer}>
        <table
          cellPadding={0}
          cellSpacing={0}
          style={{ margin: "0 auto" }}
        >
          <tr>
            {steps.map((step, i) => {
              const isActive = i <= currentIndex;
              const isCurrent = step === newStatus;
              return (
                <React.Fragment key={step}>
                  <td style={{ textAlign: "center" as const, padding: "0 4px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: isActive
                          ? isCurrent
                            ? STATUS_COLORS[step]
                            : BRAND.primary
                          : "#e5e7eb",
                        color: isActive ? "#fff" : "#9ca3af",
                        fontSize: "12px",
                        fontWeight: 600,
                        lineHeight: "32px",
                        textAlign: "center" as const,
                        display: "inline-block",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: isActive ? "#111" : "#9ca3af",
                        marginTop: "4px",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {STATUS_LABELS[step]}
                    </div>
                  </td>
                  {i < steps.length - 1 && (
                    <td style={{ verticalAlign: "top", paddingTop: "14px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "2px",
                          backgroundColor:
                            i < currentIndex ? BRAND.primary : "#e5e7eb",
                        }}
                      />
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>
        </table>
      </Section>

      <Text style={changeText}>
        {changedByName} moved this request from{" "}
        <strong>{STATUS_LABELS[oldStatus] || oldStatus}</strong> to{" "}
        <strong>{STATUS_LABELS[newStatus] || newStatus}</strong>
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

const stepperContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const changeText: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  lineHeight: "22px",
  margin: 0,
};

StatusChangedEmail.PreviewProps = {
  requestTitle: "Logo Design v2",
  requestUrl: "https://vimistudio.com/portal/requests/123",
  oldStatus: "in_progress",
  newStatus: "review",
  changedByName: "Carlos Romero",
} satisfies StatusChangedEmailProps;
