import * as React from "react";
import { EmailLayout, BRAND, Heading, Text, Section } from "./layout";
import type { Locale } from "@/lib/portal-strings";

interface StatusChangedEmailProps {
  requestTitle: string;
  requestUrl: string;
  oldStatus: string;
  newStatus: string;
  changedByName: string;
  locale?: Locale;
}

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    queued: "Up Next",
    in_progress: "In Progress",
    review: "Ready for You",
    done: "Delivered",
  },
  es: {
    queued: "En cola",
    in_progress: "En proceso",
    review: "Listo para ti",
    done: "Entregado",
  },
};

const STRINGS = {
  en: {
    preview: (title: string, label: string) => `"${title}" moved to ${label}`,
    cta: {
      review: "See Your Designs",
      done: "Download Your Designs",
      default: "View Request",
    },
    heading: {
      in_progress: "Your Designer Started Working",
      review: "Your Designs Are Ready for Review",
      done: "Your Designs Have Been Delivered",
      default: "Status Updated",
    },
    changeFrom: "moved this request from",
    changeTo: "to",
  },
  es: {
    preview: (title: string, label: string) => `«${title}» pasó a ${label}`,
    cta: {
      review: "Ver tus diseños",
      done: "Descargar tus diseños",
      default: "Ver la solicitud",
    },
    heading: {
      in_progress: "Tu diseñador empezó a trabajar",
      review: "Tus diseños están listos para revisar",
      done: "Tus diseños fueron entregados",
      default: "Estado actualizado",
    },
    changeFrom: "cambió esta solicitud de",
    changeTo: "a",
  },
} as const;

const STATUS_COLORS: Record<string, string> = {
  queued: "#9ca3af",
  in_progress: "#3b82f6",
  review: "#f59e0b",
  done: "#10b981",
};

export function StatusChangedEmail({
  requestTitle,
  requestUrl,
  oldStatus,
  newStatus,
  changedByName,
  locale = "en",
}: StatusChangedEmailProps) {
  const s = STRINGS[locale];
  const labels = STATUS_LABELS[locale];
  const steps = ["queued", "in_progress", "review", "done"];
  const currentIndex = steps.indexOf(newStatus);
  const ctaLabel =
    newStatus === "review"
      ? s.cta.review
      : newStatus === "done"
        ? s.cta.done
        : s.cta.default;
  const headingText =
    newStatus === "in_progress"
      ? s.heading.in_progress
      : newStatus === "review"
        ? s.heading.review
        : newStatus === "done"
          ? s.heading.done
          : s.heading.default;

  return (
    <EmailLayout
      previewText={s.preview(requestTitle, labels[newStatus] || newStatus)}
      ctaUrl={requestUrl}
      ctaLabel={ctaLabel}
      locale={locale}
    >
      <Heading style={heading}>{headingText}</Heading>
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
                      {labels[step]}
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
        {changedByName} {s.changeFrom}{" "}
        <strong>{labels[oldStatus] || oldStatus}</strong> {s.changeTo}{" "}
        <strong>{labels[newStatus] || newStatus}</strong>
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
