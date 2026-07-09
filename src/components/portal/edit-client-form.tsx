"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings02Icon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLocale } from "./locale-provider";
import { t as translate, type Locale } from "@/lib/portal-i18n";
import { fetchClientTeam } from "@/lib/client-team";
import { TeamAvatarCluster } from "./team-cluster";
import { usePricePrivacy, PRICE_MASK } from "@/hooks/use-price-privacy";

interface Client {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  locale?: string | null;
  logo_url?: string | null;
  accent_color?: string | null;
  deal_terms?: string | null;
  studio_note?: string | null;
  designer_id?: string | null;
  engagement_started_at?: string | null;
}

interface AdminOption {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  title: string | null;
}

/** A team member as edited locally (diffed against the loaded snapshot on save). */
interface EditorTeamMember {
  profileId: string;
  fullName: string | null;
  avatarUrl: string | null;
  roleLabel: string | null;
  isLead: boolean;
}

const DEFAULT_ACCENT = "#5B4BD6";

/** Stable key for dirty-diffing the team (order-independent). */
const teamKey = (team: EditorTeamMember[]) =>
  JSON.stringify(
    team
      .map((m) => [m.profileId, m.isLead, (m.roleLabel ?? "").trim()])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  );

// The five Vimi Client Journey preset accents (approved v2 prototype).
const ACCENTS: { hex: string; name: string }[] = [
  { hex: "#DA5B34", name: "Ember" },
  { hex: "#5B4BD6", name: "Vimi violet" },
  { hex: "#2E8B57", name: "Forest" },
  { hex: "#B03A5B", name: "Rosewood" },
  { hex: "#03296A", name: "Deep sea" },
];

const isHex6 = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim());

const slugify = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const firstName = (full: string | null, email: string | null) =>
  full?.trim().split(/\s+/)[0] || email?.split("@")[0] || "Vimi";

export function EditClientDialog({ client }: { client: Client }) {
  const router = useRouter();
  const { t } = useLocale();
  const clientLocale = ((client.locale as Locale) ?? "en") as Locale;
  // Client-facing preview copy follows the CLIENT's locale (like plan-editor's `tc`).
  const tc = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) =>
    translate(key, clientLocale, vars);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [slug, setSlug] = useState(client.slug);
  // Existing clients already have a slug → treat as manually set so name edits
  // don't silently rewrite a live URL.
  const [slugTouched, setSlugTouched] = useState(Boolean(client.slug));
  const [retainer, setRetainer] = useState(client.retainer_amount ?? 0);
  const [isActive, setIsActive] = useState(client.is_active);
  const [locale, setLocale] = useState<Locale>(((client.locale as Locale) ?? "en") as Locale);
  const [logoUrl, setLogoUrl] = useState(client.logo_url ?? "");
  const [logoError, setLogoError] = useState(false);
  const [accentColor, setAccentColor] = useState(client.accent_color ?? DEFAULT_ACCENT);
  const [dealTerms, setDealTerms] = useState(client.deal_terms ?? "");
  const [studioNote, setStudioNote] = useState(client.studio_note ?? "");
  const [engagementStartedAt, setEngagementStartedAt] = useState(
    client.engagement_started_at ?? ""
  );
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [team, setTeam] = useState<EditorTeamMember[]>([]);
  // Snapshot of the team as loaded — diffed on save for upserts/deletes + dirty.
  const [initialTeamKey, setInitialTeamKey] = useState("[]");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // mobile toggle
  // Screen-share safety: money is masked in the editor while prices are hidden.
  // The retainer input reveals its real value only while focused (for editing).
  const { hidden: pricesHidden } = usePricePrivacy();
  const [retainerFocused, setRetainerFocused] = useState(false);
  const maskRetainer = pricesHidden && !retainerFocused;

  // Load studio admins (roster) + the client's current team (only while open).
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();

    // Admins — include title/avatar for roster pills. `title` may not exist
    // before the migration; fall back to a title-less select if so.
    (async () => {
      const primary = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, title")
        .eq("role", "admin")
        .order("full_name");
      if (primary.error) {
        const fb = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .eq("role", "admin")
          .order("full_name");
        setAdmins((fb.data ?? []).map((a) => ({ ...a, title: null })));
      } else {
        setAdmins((primary.data ?? []) as AdminOption[]);
      }
    })();

    // Team — fetchClientTeam tolerates the table not existing (→ []).
    fetchClientTeam(supabase, client.id).then((rows) => {
      // Guarantee exactly one lead when the crew is non-empty.
      let members: EditorTeamMember[] = rows.map((r) => ({
        profileId: r.profileId,
        fullName: r.fullName,
        avatarUrl: r.avatarUrl,
        roleLabel: r.roleLabel,
        isLead: r.isLead,
      }));
      if (members.length > 0 && !members.some((m) => m.isLead)) {
        members = members.map((m, i) => ({ ...m, isLead: i === 0 }));
      }
      setTeam(members);
      setInitialTeamKey(teamKey(members));
    });
  }, [open, client.id]);

  const accentValid = isHex6(accentColor);

  const teamDirty = teamKey(team) !== initialTeamKey;
  const isDirty =
    name !== client.name ||
    slug !== client.slug ||
    retainer !== (client.retainer_amount ?? 0) ||
    isActive !== client.is_active ||
    locale !== ((client.locale as Locale) ?? "en") ||
    logoUrl !== (client.logo_url ?? "") ||
    accentColor !== (client.accent_color ?? DEFAULT_ACCENT) ||
    dealTerms !== (client.deal_terms ?? "") ||
    studioNote !== (client.studio_note ?? "") ||
    teamDirty ||
    engagementStartedAt !== (client.engagement_started_at ?? "");

  const lead = team.find((m) => m.isLead) ?? team[0] ?? null;
  const leadFirstName = lead ? firstName(lead.fullName, null) : "Vimi";
  const roster = admins.filter((a) => !team.some((m) => m.profileId === a.id));
  const showLogo = Boolean(logoUrl.trim()) && !logoError;

  const makeLead = (profileId: string) =>
    setTeam((prev) => prev.map((m) => ({ ...m, isLead: m.profileId === profileId })));

  const addMember = (a: AdminOption) => {
    setTeam((prev) =>
      prev.some((m) => m.profileId === a.id)
        ? prev
        : [
            ...prev,
            {
              profileId: a.id,
              fullName: a.full_name,
              avatarUrl: a.avatar_url,
              roleLabel: a.title,
              isLead: prev.length === 0, // first member is the contact
            },
          ]
    );
  };

  const removeMember = (m: EditorTeamMember) => {
    if (team.length <= 1) {
      toast.error(t("clientEditor.cantRemoveLast"));
      return;
    }
    if (m.isLead) {
      toast.error(t("clientEditor.cantRemoveLead"));
      return;
    }
    setTeam((prev) => prev.filter((x) => x.profileId !== m.profileId));
  };

  const setRole = (profileId: string, label: string) =>
    setTeam((prev) =>
      prev.map((m) => (m.profileId === profileId ? { ...m, roleLabel: label } : m))
    );

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlugTouched(true);
    setSlug(v);
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    if (accentColor.trim() && !accentValid) {
      toast.error("Accent color must be a 6-digit hex like #5B4BD6");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    // Re-stamp the note's freshness only when its text actually changed, so
    // editing unrelated fields doesn't falsely refresh the "hace X días" caption.
    const noteChanged =
      (studioNote.trim() || null) !== (client.studio_note ?? null);
    // designer_id stays the routing source of truth — keep it in sync with the
    // team's lead (contacto principal). When the team is empty (no crew, or the
    // client_team table isn't there yet pre-migration) DON'T touch designer_id,
    // so saving other fields never wipes a client's existing designer.
    const leadProfileId =
      team.length > 0 ? lead?.profileId ?? null : client.designer_id ?? null;
    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        slug: slugify(slug),
        retainer_amount: retainer,
        is_active: isActive,
        locale,
        logo_url: logoUrl.trim() || null,
        accent_color: accentColor.trim() || null,
        deal_terms: dealTerms.trim() || null,
        studio_note: studioNote.trim() || null,
        designer_id: leadProfileId,
        engagement_started_at: engagementStartedAt || null,
        ...(noteChanged && {
          studio_note_updated_at: studioNote.trim()
            ? new Date().toISOString()
            : null,
        }),
      })
      .eq("id", client.id);

    if (error) {
      toast.error(error.message || "Couldn't save changes. Please try again.");
      setIsSaving(false);
      return;
    }

    // Team sync (diff-based). Only touch client_team when the crew changed, so
    // pre-migration saves that never opened the team still succeed.
    if (teamDirty) {
      if (team.length > 0) {
        const { error: upsertErr } = await supabase.from("client_team").upsert(
          team.map((m) => ({
            client_id: client.id,
            profile_id: m.profileId,
            role_label: m.roleLabel?.trim() || null,
            is_lead: m.isLead,
          })),
          { onConflict: "client_id,profile_id" }
        );
        if (upsertErr) {
          toast.error(upsertErr.message || "Couldn't save the team.");
          setIsSaving(false);
          return;
        }
      }
      const currentIds = new Set(team.map((m) => m.profileId));
      const removedIds = JSON.parse(initialTeamKey)
        .map((row: [string, boolean, string]) => row[0])
        .filter((id: string) => !currentIds.has(id));
      if (removedIds.length > 0) {
        const { error: delErr } = await supabase
          .from("client_team")
          .delete()
          .eq("client_id", client.id)
          .in("profile_id", removedIds);
        if (delErr) {
          toast.error(delErr.message || "Couldn't update the team.");
          setIsSaving(false);
          return;
        }
      }
    }

    toast.success("Client updated");
    setIsSaving(false);
    setOpen(false);

    // If slug changed, redirect to new URL
    const newSlug = slugify(slug);
    if (newSlug !== client.slug) {
      router.push(`/portal/admin/clients/${newSlug}`);
    } else {
      router.refresh();
    }
  };

  const accentStyle = { transition: "background-color .2s ease, border-color .2s ease, color .2s ease" };
  const displaySlug = slugify(slug) || "…";

  // Toggle-button base style used by language + designer pickers.
  const toggleBtn = (selected: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-4 min-h-[44px] text-sm font-medium transition-colors ${
      selected
        ? "border-transparent text-white"
        : "border-[color:rgba(28,27,31,0.16)] text-[color:var(--vimi-ink)] hover:bg-[color:rgba(28,27,31,0.04)]"
    }`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings02Icon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header: accent square + live name + active pill + dirty indicator */}
        <DialogHeader className="shrink-0 flex-row items-center gap-3 space-y-0 px-6 py-4 border-b border-[color:rgba(28,27,31,0.08)] text-left pr-14">
          <span
            className="h-8 w-8 shrink-0 rounded-md"
            style={{ background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
            aria-hidden="true"
          />
          <DialogTitle className="font-serif italic text-xl leading-none tracking-tight truncate min-w-0">
            {name || "—"}
          </DialogTitle>

          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            aria-pressed={isActive}
            className={`ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 min-h-[32px] text-[11px] font-bold tracking-[0.06em] transition-colors ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`}
              aria-hidden="true"
            />
            {isActive ? t("clientEditor.active") : t("clientEditor.paused")}
          </button>

          <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isDirty ? "bg-amber-500" : "bg-emerald-500"}`}
              aria-hidden="true"
            />
            {isDirty ? t("clientEditor.dirty") : t("clientEditor.saved")}
          </span>

          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="md:hidden shrink-0 rounded-full border border-[color:rgba(28,27,31,0.16)] px-3 min-h-[32px] text-[11px] font-semibold text-[color:var(--vimi-ink)]"
          >
            {showPreview ? t("clientEditor.showForm") : t("clientEditor.showPreview")}
          </button>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* ── FORM (left) ───────────────────────────────────────── */}
          <div className={`${showPreview ? "hidden" : "flex"} md:flex flex-1 min-w-0 flex-col`}>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
              {/* IDENTITY */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6B75]">
                  {t("clientEditor.sectionIdentity")}
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="client-name">{t("clientEditor.name")}</Label>
                  <Input
                    id="client-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-slug">{t("clientEditor.slug")}</Label>
                  <div className="flex h-10 items-center rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <span className="pl-3 text-muted-foreground select-none whitespace-nowrap">
                      vimistudio.com/
                    </span>
                    <input
                      id="client-slug"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="flex-1 min-w-0 bg-transparent py-2 pr-3 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-logo">{t("clientEditor.logo")}</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-16 w-16 shrink-0 rounded-lg border border-[color:rgba(28,27,31,0.12)] flex items-center justify-center overflow-hidden"
                        style={{
                          background: showLogo || logoUrl.trim()
                            ? "rgba(28,27,31,0.03)"
                            : accentValid
                              ? accentColor
                              : "#C9C6BF",
                          ...accentStyle,
                        }}
                      >
                        {showLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt=""
                            className="h-full w-full object-contain"
                            onError={() => setLogoError(true)}
                          />
                        ) : logoUrl.trim() ? (
                          <span className="text-[10px] text-muted-foreground">
                            {t("clientEditor.noLogo")}
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-white">
                            {initials(name)}
                          </span>
                        )}
                      </div>
                      <Input
                        id="client-logo"
                        type="url"
                        placeholder={t("clientEditor.logoPlaceholder")}
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setLogoError(false);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-accent">{t("clientEditor.accent")}</Label>
                    <div className="flex items-center gap-2">
                      {ACCENTS.map((a) => {
                        const selected = accentColor.toLowerCase() === a.hex.toLowerCase();
                        return (
                          <button
                            key={a.hex}
                            type="button"
                            onClick={() => setAccentColor(a.hex)}
                            title={a.name}
                            aria-label={a.name}
                            aria-pressed={selected}
                            className="h-11 w-11 rounded-full transition-shadow"
                            style={{
                              background: a.hex,
                              boxShadow: selected
                                ? `0 0 0 2px #fff, 0 0 0 4px ${a.hex}`
                                : "0 0 0 1px rgba(28,27,31,.12)",
                            }}
                          />
                        );
                      })}
                    </div>
                    <Input
                      id="client-accent"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder={DEFAULT_ACCENT}
                      aria-invalid={accentColor.trim() !== "" && !accentValid}
                      className={`w-28 font-mono text-sm ${
                        accentColor.trim() && !accentValid ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                </div>
              </section>

              {/* AGREEMENT */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6B75]">
                  {t("clientEditor.sectionAgreement")}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-retainer">{t("clientEditor.retainer")}</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="pl-3 text-muted-foreground select-none">$</span>
                      <input
                        id="client-retainer"
                        inputMode="numeric"
                        value={maskRetainer ? PRICE_MASK : retainer}
                        onFocus={() => setRetainerFocused(true)}
                        onBlur={() => setRetainerFocused(false)}
                        onChange={(e) =>
                          setRetainer(Number(e.target.value.replace(/\D/g, "")) || 0)
                        }
                        className="flex-1 min-w-0 bg-transparent px-2 py-2 outline-none"
                      />
                      <span className="pr-3 text-muted-foreground select-none">
                        {t("clientEditor.perMonth")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-engagement-start">
                      {t("clientEditor.startDate")}
                    </Label>
                    <Input
                      id="client-engagement-start"
                      type="date"
                      value={engagementStartedAt}
                      onChange={(e) => setEngagementStartedAt(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t("clientEditor.startHint")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-deal-terms">{t("clientEditor.terms")}</Label>
                  <Input
                    id="client-deal-terms"
                    placeholder={t("clientEditor.termsPlaceholder")}
                    value={dealTerms}
                    onChange={(e) => setDealTerms(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("clientEditor.termsHint")}
                  </p>
                </div>
              </section>

              {/* TEAM */}
              <section className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6B75]">
                    {t("clientEditor.sectionTeam")}
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    · {t("clientEditor.teamSubtitle")}
                  </span>
                </div>

                <div className="space-y-2">
                  {team.map((m) => (
                    <div
                      key={m.profileId}
                      className="flex items-center gap-3 rounded-xl border border-[color:rgba(28,27,31,0.1)] bg-white px-3 py-2.5"
                    >
                      {m.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.avatarUrl}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
                        >
                          {initials(m.fullName || "A")}
                        </span>
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-[color:var(--vimi-ink)] truncate">
                          {m.fullName || "Admin"}
                        </span>
                        {editingRole === m.profileId ? (
                          <input
                            autoFocus
                            value={m.roleLabel ?? ""}
                            placeholder={t("clientEditor.rolePlaceholder")}
                            onChange={(e) => setRole(m.profileId, e.target.value)}
                            onBlur={() => setEditingRole(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditingRole(null);
                            }}
                            className="mt-0.5 w-32 rounded border border-input bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingRole(m.profileId)}
                            className="mt-0.5 self-start rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] bg-[color:rgba(28,27,31,0.06)] text-[#6E6B75] hover:bg-[color:rgba(28,27,31,0.1)] transition-colors"
                          >
                            {(m.roleLabel?.trim() || t("clientEditor.rolePlaceholder")).toUpperCase()}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => makeLead(m.profileId)}
                        aria-pressed={m.isLead}
                        className="shrink-0 inline-flex items-center rounded-full px-2.5 min-h-[32px] text-[10px] font-bold tracking-[0.06em] transition-colors"
                        style={
                          m.isLead
                            ? { background: "#FFF3DE", color: "#B26F0E" }
                            : { background: "rgba(28,27,31,0.05)", color: "#6E6B75" }
                        }
                      >
                        {m.isLead ? "★ " : ""}
                        {t("clientEditor.contact")}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeMember(m)}
                        aria-label={t("clientEditor.removeMember", { name: m.fullName || "" })}
                        className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-[color:rgba(28,27,31,0.06)] hover:text-foreground transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setRosterOpen((v) => !v)}
                    aria-expanded={rosterOpen}
                    className="w-full rounded-xl border border-dashed border-[color:rgba(28,27,31,0.2)] px-3 py-2.5 text-sm font-semibold text-[color:var(--vimi-muted)] hover:border-[color:rgba(28,27,31,0.35)] hover:text-[color:var(--vimi-ink)] transition-colors min-h-[44px]"
                  >
                    {t("clientEditor.addFromStudio")}
                  </button>

                  {rosterOpen && (
                    <div className="rounded-xl border border-[color:rgba(28,27,31,0.1)] bg-[color:rgba(28,27,31,0.02)] p-2.5">
                      {roster.length === 0 ? (
                        <p className="px-1 py-1.5 text-[12px] text-muted-foreground">
                          {t("clientEditor.rosterEmpty")}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {roster.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => addMember(a)}
                              className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(28,27,31,0.14)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[color:var(--vimi-ink)] hover:bg-[color:rgba(28,27,31,0.04)] transition-colors min-h-[36px]"
                            >
                              {a.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={a.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                              ) : (
                                <span className="h-5 w-5 rounded-full bg-[color:rgba(28,27,31,0.1)] text-[color:var(--vimi-ink)] flex items-center justify-center text-[9px] font-bold">
                                  {initials(a.full_name || a.email || "A")}
                                </span>
                              )}
                              <span className="truncate max-w-[120px]">
                                {a.full_name || a.email || "Admin"}
                              </span>
                              {a.title && (
                                <span className="text-[10px] uppercase tracking-[0.05em] text-[#6E6B75]">
                                  {a.title}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("clientEditor.language")}</Label>
                  <div className="flex items-center gap-2">
                    {(["es", "en"] as const).map((lc) => {
                      const selected = locale === lc;
                      return (
                        <button
                          key={lc}
                          type="button"
                          onClick={() => setLocale(lc)}
                          aria-pressed={selected}
                          className={toggleBtn(selected)}
                          style={selected ? { background: accentColor, ...accentStyle } : undefined}
                        >
                          {lc === "es" ? t("clientEditor.langEs") : t("clientEditor.langEn")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-studio-note">{t("clientEditor.note")}</Label>
                  <Input
                    id="client-studio-note"
                    className="italic"
                    placeholder={t("clientEditor.notePlaceholder")}
                    value={studioNote}
                    onChange={(e) => setStudioNote(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t("clientEditor.noteHint")}
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* ── LIVE PREVIEW (right) ──────────────────────────────── */}
          {/* Decorative duplicate of the form values — hidden from AT. */}
          <aside
            aria-hidden="true"
            className={`${showPreview ? "block" : "hidden"} md:block w-full md:w-[300px] shrink-0 overflow-y-auto border-t md:border-t-0 md:border-l border-[color:rgba(28,27,31,0.1)] px-5 py-5`}
            style={{ background: "#EFEDE6" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6E6B75] mb-3 truncate">
              {t("clientEditor.previewHeading", { name: name || "—" })}
            </p>

            {/* Mini portal card */}
            <div className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(28,27,31,0.08)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center overflow-hidden text-white text-xs font-bold"
                  style={{ background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
                >
                  {showLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    initials(name)
                  )}
                </div>
                <span className="text-[13px] font-semibold text-[color:var(--vimi-ink)] truncate">
                  {name || "—"}
                </span>
                <span
                  className="ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em]"
                  style={{
                    background: `${accentValid ? accentColor : "#C9C6BF"}1A`,
                    color: accentValid ? accentColor : "#6E6B75",
                    ...accentStyle,
                  }}
                >
                  {tc("clientEditor.cardMonth")}
                </span>
              </div>

              <p className="mt-3 font-serif italic text-[15px] text-[color:var(--vimi-ink)]">
                {tc("clientEditor.cardPlanTitle")}
              </p>

              <div className="mt-2 h-1.5 w-full rounded-full bg-[color:rgba(28,27,31,0.08)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "40%", background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
                />
              </div>

              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full motion-safe:animate-pulse"
                    style={{ background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
                  />
                  <span className="text-[12px] text-[color:var(--vimi-ink)]">
                    {tc("clientEditor.sampleMilestone1")}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[color:rgba(28,27,31,0.18)]" />
                  <span className="text-[12px] text-muted-foreground">
                    {tc("clientEditor.sampleMilestone2")}
                  </span>
                </li>
              </ul>

              <div
                className="mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
                style={{ background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
              >
                {tc("clientEditor.cardNewRequest")}
              </div>
            </div>

            {/* Studio note, quoted + signed by the lead */}
            {studioNote.trim() && (
              <div className="mt-4">
                <p className="font-serif italic text-[13px] leading-snug text-[color:var(--vimi-ink)]">
                  &ldquo;{studioNote.trim()}&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: accentValid ? accentColor : "#C9C6BF", ...accentStyle }}
                  >
                    {initials(leadFirstName)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">— {leadFirstName}</span>
                </div>
              </div>
            )}

            {/* Crew cluster + count — mirrors the client's sidebar / agreement */}
            {team.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <TeamAvatarCluster
                  members={team.map((m) => ({ fullName: m.fullName, avatarUrl: m.avatarUrl }))}
                  accent={accentValid ? accentColor : "#C9C6BF"}
                  size={22}
                />
                <span className="text-[11px] text-muted-foreground">
                  {team.length === 1
                    ? tc("team.countOne")
                    : tc("team.count", { n: team.length })}
                </span>
              </div>
            )}

            {/* Portal + Agreement summary */}
            <dl className="mt-4 space-y-1.5 text-[11px]">
              <div className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">{t("clientEditor.previewPortal")}</dt>
                <dd className="font-mono text-[color:var(--vimi-ink)] truncate">vimistudio.com/{displaySlug}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">{t("clientEditor.previewAgreement")}</dt>
                <dd className="text-[color:var(--vimi-ink)] truncate">
                  {pricesHidden ? PRICE_MASK : `$${retainer}`}
                  {t("clientEditor.perMonth")}
                  {dealTerms.trim() ? ` · ${dealTerms.trim()}` : ""}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-[10px] leading-relaxed text-[#6E6B75]">
              {t("clientEditor.previewCaption")}
            </p>
          </aside>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-[color:rgba(28,27,31,0.08)] bg-background">
          <button
            onClick={() => setOpen(false)}
            disabled={isSaving}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-2"
          >
            {t("clientEditor.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="ml-auto inline-flex items-center justify-center rounded-full bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] px-6 py-2.5 text-sm font-semibold min-h-[44px] transition-colors hover:bg-[color:var(--vimi-ink)]/90 disabled:bg-[rgba(28,27,31,0.06)] disabled:text-[color:var(--vimi-muted)] disabled:cursor-not-allowed"
          >
            {isSaving ? t("clientEditor.saving") : t("clientEditor.save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
