"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "./locale-provider";
import { usePricePrivacy, maskPrice } from "@/hooks/use-price-privacy";
import { STUDIO_WHATSAPP_URL } from "@/lib/studio";
import {
  docBadge,
  isPreviewable,
  type EngagementMonth,
} from "@/lib/agreement";
import { DocViewer } from "./doc-viewer";

export interface HubDoc {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  status_label: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  sort: number;
  signedUrl: string | null;
}

interface Person {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface StudioTeamMember {
  fullName: string | null;
  avatarUrl: string | null;
  roleLabel: string | null;
  isLead: boolean;
}

interface AgreementViewProps {
  companyName: string;
  retainerAmount: number | null;
  dealTerms: string | null;
  month: EngagementMonth | null;
  monthYear: string;
  sinceDate: string | null;
  docs: HubDoc[];
  designer: Person | null;
  /** Full studio crew, lead first. Empty → fall back to single-designer card. */
  team: StudioTeamMember[];
  members: Person[];
  isImpersonatingAdmin?: boolean;
}

function initialOf(name: string | null | undefined) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export function AgreementView({
  companyName,
  retainerAmount,
  dealTerms,
  month,
  monthYear,
  sinceDate,
  docs,
  designer,
  team,
  members,
  isImpersonatingAdmin = false,
}: AgreementViewProps) {
  const { t } = useLocale();
  // Client sees their own price. An impersonating admin gets it masked when the
  // screen-share price toggle is on.
  const { hidden: pricesHidden } = usePricePrivacy();
  const priceMasked = isImpersonatingAdmin && pricesHidden;

  const [activeDoc, setActiveDoc] = useState<HubDoc | null>(null);

  const showDeal = retainerAmount != null || (dealTerms?.trim().length ?? 0) > 0;
  const amountText =
    retainerAmount != null ? `USD $${retainerAmount.toLocaleString()}` : "—";

  const companyPill = (
    <div className="flex items-center gap-2.5 rounded-full border border-[color:var(--vimi-border)] bg-white px-4 py-2.5">
      <span
        className="w-2.5 h-2.5 rounded-[4px] shrink-0"
        style={{ background: "var(--accent)" }}
      />
      <span className="text-sm font-bold tracking-[-0.01em] text-[color:var(--vimi-ink)]">
        {companyName}
      </span>
    </div>
  );

  return (
    <div className="max-w-[980px] mx-auto pb-24">
      {/* Back to board */}
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)] transition-colors pb-5"
      >
        ← {t("agreement.back")}
      </Link>

      {/* Hero */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
        <div className="flex flex-col gap-2">
          {month && (
            <div className="text-[11.5px] font-semibold tracking-[0.14em] uppercase text-[color:var(--vimi-muted)]">
              {t("agreement.monthChip", {
                n: String(month.monthIndex).padStart(2, "0"),
                monthYear,
              })}
            </div>
          )}
          <h1 className="font-serif italic text-4xl leading-[1.08] text-[color:var(--vimi-ink)]">
            {t("agreement.title")}
          </h1>
          <p className="text-[14.5px] text-[color:var(--vimi-muted)]">
            {t("agreement.subtitle")}
          </p>
        </div>
        {companyPill}
      </div>

      {/* Deal card — the one accent-framed card (Von Restorff) */}
      {showDeal && (
        <div
          className="bg-white rounded-[20px] px-7 py-6 flex flex-wrap gap-6 items-center mb-4 shadow-[0_14px_34px_rgba(28,27,31,0.06)]"
          style={{ border: "1.5px solid var(--accent)" }}
        >
          <div className="flex flex-col gap-1 min-w-[170px]">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--vimi-muted)]">
              {t("agreement.investment")}
            </span>
            <span className="font-serif text-[34px] leading-none text-[color:var(--vimi-ink)]">
              {maskPrice(amountText, priceMasked)}
            </span>
          </div>

          <div className="w-px self-stretch bg-[color:var(--vimi-border)]" />

          <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            {dealTerms?.trim() && (
              <span className="text-[14.5px] font-semibold text-[color:var(--vimi-ink)]">
                {maskPrice(dealTerms, priceMasked)}
              </span>
            )}
            <span className="text-[13px] text-[color:var(--vimi-muted)]">
              {t("agreement.ownership", { company: companyName })}
              {sinceDate ? ` ${t("agreement.since", { date: sinceDate })}` : ""}
            </span>
          </div>

          {month && (
            <div className="flex flex-col gap-1.5 items-end">
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--vimi-muted)]">
                {t("agreement.monthProgress")}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-[120px] h-[5px] rounded-full bg-[color:rgba(28,27,31,0.08)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(month.pct * 100)}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <span className="text-[12.5px] font-semibold text-[color:var(--vimi-muted)]">
                  {t("agreement.dayOfMonth", { d: month.dayOfMonth })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--vimi-muted)] mt-7 mb-3">
        {t("agreement.docsTitle")}
      </div>

      {docs.length === 0 ? (
        <div className="rounded-[18px] border border-[color:var(--vimi-border)] bg-[#FBFAF8] px-6 py-10 text-center">
          <p className="text-[13.5px] text-[color:var(--vimi-muted)]">
            {t("agreement.docsEmpty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
          {docs.map((doc) => (
            <DocCard key={doc.id} doc={doc} onOpen={setActiveDoc} />
          ))}
        </div>
      )}

      {/* People */}
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--vimi-muted)] mt-8 mb-3">
        {t("agreement.peopleTitle")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Studio card */}
        <div className="bg-white rounded-[18px] border border-[color:var(--vimi-border)] p-5 flex flex-col gap-3.5">
          <span className="text-xs font-bold text-[color:var(--vimi-muted)]">
            {t("agreement.fromStudio")}
          </span>
          {team.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {team.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatarUrl}
                      alt={m.fullName ?? ""}
                      className="w-[42px] h-[42px] rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span
                      className="w-[42px] h-[42px] rounded-full text-white flex items-center justify-center font-bold text-[15px] shrink-0"
                      style={{ background: "var(--accent)" }}
                    >
                      {initialOf(m.fullName)}
                    </span>
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold text-[color:var(--vimi-ink)] truncate">
                      {m.fullName || "Vimi Studio"}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--vimi-muted)]">
                      {m.roleLabel?.trim() || "Vimi Studio"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {designer?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={designer.avatar_url}
                  alt={designer.full_name ?? "Vimi Studio"}
                  className="w-[42px] h-[42px] rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-[42px] h-[42px] rounded-full bg-[#5B4BD6] text-white flex items-center justify-center font-bold text-[15px] shrink-0">
                  {designer ? initialOf(designer.full_name) : "V"}
                </span>
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-bold text-[color:var(--vimi-ink)]">
                  {designer?.full_name || "Vimi Studio"}
                </span>
                <span className="text-[12.5px] text-[color:var(--vimi-muted)]">
                  Vimi Studio
                </span>
              </div>
            </div>
          )}
          {/* Mobile only: on desktop the sidebar already carries this WhatsApp CTA. */}
          <a
            href={STUDIO_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center justify-center gap-2 rounded-full bg-[#1FAF5A] px-3 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            {t("agreement.whatsapp")}
          </a>
        </div>

        {/* Company card */}
        <div className="bg-white rounded-[18px] border border-[color:var(--vimi-border)] p-5 flex flex-col gap-3.5">
          <span className="text-xs font-bold text-[color:var(--vimi-muted)]">
            {t("agreement.fromCompany", { company: companyName })}
          </span>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              {m.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.avatar_url}
                  alt={m.full_name ?? ""}
                  className="w-[42px] h-[42px] rounded-full object-cover shrink-0"
                />
              ) : (
                <span
                  className="w-[42px] h-[42px] rounded-full text-white flex items-center justify-center font-bold text-[15px] shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {initialOf(m.full_name)}
                </span>
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-bold text-[color:var(--vimi-ink)]">
                  {m.full_name || "—"}
                </span>
              </div>
            </div>
          ))}
          <Link
            href="/portal/profile"
            className="rounded-[14px] border-[1.5px] border-dashed border-[color:rgba(28,27,31,0.18)] px-3 py-3 text-center text-[13.5px] font-semibold text-[color:var(--vimi-muted)] hover:border-[color:rgba(28,27,31,0.3)] transition-colors"
          >
            {t("agreement.invite")}
          </Link>
        </div>
      </div>

      <DocViewer
        doc={activeDoc}
        open={!!activeDoc}
        onOpenChange={(o) => !o && setActiveDoc(null)}
      />
    </div>
  );
}

/**
 * A single document card. Three states:
 *  - placeholder (no file_path): muted, non-clickable, "En preparación…"
 *  - ready + previewable: opens the doc-viewer modal
 *  - download-only (non-previewable mime): direct download anchor
 */
function DocCard({
  doc,
  onOpen,
}: {
  doc: HubDoc;
  onOpen: (doc: HubDoc) => void;
}) {
  const { t } = useLocale();
  const isPlaceholder = !doc.file_path || !doc.signedUrl;
  const previewable = !isPlaceholder && isPreviewable(doc.mime_type);
  const badge = docBadge(doc.mime_type, doc.file_name);

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-extrabold tracking-[0.04em]"
          style={
            isPlaceholder
              ? { background: "rgba(28,27,31,0.05)", color: "var(--vimi-faint)" }
              : {
                  background: "color-mix(in srgb, var(--accent) 12%, white)",
                  color: "var(--accent)",
                }
          }
        >
          {isPlaceholder ? "·30" : badge}
        </span>
        {doc.status_label && (
          <span className="text-[10.5px] font-bold tracking-[0.08em] rounded-md px-2 py-1 bg-[color:rgba(28,27,31,0.05)] text-[color:var(--vimi-muted)]">
            {doc.status_label}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold leading-[1.3] text-[color:var(--vimi-ink)]">
          {doc.title}
        </span>
        {doc.description && (
          <span className="text-[12.5px] text-[color:var(--vimi-muted)]">
            {doc.description}
          </span>
        )}
      </div>
      <span
        className="text-[13px] font-semibold"
        style={{ color: isPlaceholder ? "var(--vimi-faint)" : "var(--accent)" }}
      >
        {isPlaceholder
          ? t("agreement.inPreparation")
          : previewable
            ? t("agreement.view")
            : t("agreement.download")}
      </span>
    </>
  );

  const cardClass =
    "rounded-[18px] border border-[color:var(--vimi-border)] p-5 flex flex-col gap-3.5 text-left";

  if (isPlaceholder) {
    return (
      <div className={`${cardClass} bg-[#FBFAF8]`} aria-disabled="true">
        {inner}
      </div>
    );
  }

  const hoverClass =
    "bg-white transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(28,27,31,0.08)]";

  // Previewable docs open the in-app viewer modal; everything else is a direct
  // download tile.
  if (previewable) {
    return (
      <button
        type="button"
        onClick={() => onOpen(doc)}
        className={`${cardClass} ${hoverClass}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <a
      href={doc.signedUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      download={doc.file_name ?? undefined}
      className={`${cardClass} ${hoverClass}`}
    >
      {inner}
    </a>
  );
}
