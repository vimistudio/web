"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusSignIcon } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { usePricePrivacy, maskPrice } from "@/hooks/use-price-privacy";
import { AccentColorPicker } from "./accent-color-picker";

interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  created_at: string;
  logo_url?: string | null;
  accent_color?: string | null;
  openCount: number;
  doneCount: number;
}

interface AdminClientsViewProps {
  clients: ClientSummary[];
}

export function AdminClientsView({ clients }: AdminClientsViewProps) {
  const router = useRouter();
  const { hidden: pricesHidden } = usePricePrivacy();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [retainer, setRetainer] = useState("");
  const [locale, setLocale] = useState("en");
  const [logoUrl, setLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#5B4BD6");
  const [dealTerms, setDealTerms] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeClients = clients.filter((c) => c.is_active);
  const pausedClients = clients.filter((c) => !c.is_active);

  const handleCreateClient = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const supabase = createClient();
    const { error } = await supabase.from("clients").insert({
      name: name.trim(),
      slug,
      retainer_amount: retainer ? parseInt(retainer) : 0,
      locale,
      logo_url: logoUrl.trim() || null,
      accent_color: accentColor.trim() || null,
      deal_terms: dealTerms.trim() || null,
    });

    if (!error) {
      setName("");
      setRetainer("");
      setLocale("en");
      setLogoUrl("");
      setAccentColor("#5B4BD6");
      setDealTerms("");
      setIsOpen(false);
      router.refresh();
    }

    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif italic text-[28px] md:text-[34px] leading-tight tracking-tight text-[color:var(--vimi-ink)]">
          Clients
        </h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] rounded-full px-5 py-3 text-sm font-semibold shadow-[0_10px_26px_rgba(28,27,31,0.22)] transition-transform hover:-translate-y-0.5 min-h-[44px] shrink-0">
              <PlusSignIcon size={16} color="currentColor" />
              New Client
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-[color:rgba(28,27,31,0.08)] text-left">
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* IDENTITY */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6B75]">
                  Identity
                </h3>
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input
                    placeholder="e.g. Save My Dish"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Retainer ($)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 400"
                      value={retainer}
                      onChange={(e) => setRetainer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="bg-white border shadow-lg z-50">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* APPEARANCE */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6B75]">
                  Appearance
                </h3>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    type="url"
                    placeholder="https://…/logo.svg"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </div>
                <AccentColorPicker value={accentColor} onChange={setAccentColor} />
              </section>

              {/* DEAL */}
              <section className="space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6B75]">
                  Deal
                </h3>
                <div className="space-y-2">
                  <Label>Deal terms (client-facing)</Label>
                  <Input
                    placeholder="e.g. Sin permanencia · cancelan con 30 días"
                    value={dealTerms}
                    onChange={(e) => setDealTerms(e.target.value)}
                  />
                </div>
              </section>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-[color:rgba(28,27,31,0.08)] bg-background">
              <button
                onClick={handleCreateClient}
                disabled={!name.trim() || isCreating}
                className="w-full inline-flex items-center justify-center rounded-full bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] px-5 py-2.5 text-sm font-semibold min-h-[44px] transition-colors hover:bg-[color:var(--vimi-ink)]/90 disabled:bg-[rgba(28,27,31,0.06)] disabled:text-[color:var(--vimi-muted)] disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Client"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 text-[color:var(--vimi-muted)]">
          No clients yet. Add your first client to get started.
        </div>
      ) : (
        <div className="space-y-8">
          {activeClients.length > 0 && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--vimi-faint)]">
                Active
              </div>
              <div className="grid gap-3">
                {activeClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    pricesHidden={pricesHidden}
                  />
                ))}
              </div>
            </div>
          )}

          {pausedClients.length > 0 && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[color:var(--vimi-faint)]">
                Paused
              </div>
              <div className="grid gap-3 opacity-70">
                {pausedClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    pricesHidden={pricesHidden}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClientRow({
  client,
  pricesHidden,
}: {
  client: ClientSummary;
  pricesHidden: boolean;
}) {
  const accent = client.accent_color || "#5B4BD6";
  return (
    <Link href={`/portal/admin/clients/${client.slug}`}>
      <div className="rounded-2xl border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] p-4 flex items-center justify-between cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(28,27,31,0.08)]">
        <div className="flex items-center gap-4 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-[4px] shrink-0"
            style={{ background: accent }}
          />
          <div className="w-10 h-10 rounded-lg bg-[color:rgba(28,27,31,0.05)] flex items-center justify-center overflow-hidden shrink-0">
            {client.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logo_url}
                alt={client.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <Image
                src="/vimi-logo-dark.svg"
                alt={client.name}
                width={80}
                height={26}
                className="h-4 w-auto opacity-60"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[color:var(--vimi-ink)] truncate">
                {client.name}
              </h3>
              <span
                className="text-[10px] font-bold tracking-[0.06em] rounded-md px-2 py-0.5 shrink-0"
                style={
                  client.is_active
                    ? { background: "#E3F0E8", color: "#22754A" }
                    : { background: "rgba(28,27,31,0.06)", color: "#6E6B75" }
                }
              >
                {client.is_active ? "ACTIVE" : "PAUSED"}
              </span>
            </div>
            <p className="text-sm text-[color:var(--vimi-muted)]">
              {maskPrice(`$${client.retainer_amount ?? 0}`, pricesHidden)}/mo &middot;{" "}
              {client.openCount} open &middot; {client.doneCount} done
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
