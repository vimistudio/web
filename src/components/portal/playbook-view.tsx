"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowRight01Icon,
  Download01Icon,
  SearchIcon,
} from "@/components/ui/icons";
import { formatFileSize } from "@/lib/agreement";

export interface PlaybookPiece {
  id: string;
  title: string;
  type: string;
  description: string | null;
  clientName: string;
  clientSlug: string | null;
  clientAccent: string;
  approvedAt: string;
  previewUrl: string | null;
  assignee: string | null;
  fileCount: number;
  totalSize: number;
  reuseCount: number;
  reusedIn: { id: string; title: string; client: string; createdAt: string }[];
}

export interface PlaybookStats {
  deliveries: number;
  clients: number;
  reuses: number;
}

export interface PlaybookClient {
  id: string;
  name: string;
  accent: string;
}

// UPPERCASE tag labels (admin-only Spanish chrome, per spec).
const TYPE_LABELS: Record<string, string> = {
  logo: "LOGO",
  social: "SOCIAL",
  web: "WEB",
  brand: "MARCA",
  presentation: "DECK",
  other: "OTRO",
};

const TYPE_ORDER = ["logo", "social", "brand", "web", "presentation", "other"];

const TYPE_TINT: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

// Neutral, type-tinted preview when a piece has no image deliverable — never a
// fake stripe or fabricated thumbnail.
const TYPE_GRADIENT: Record<string, string> = {
  logo: "from-purple-200/70 to-purple-100/30",
  social: "from-pink-200/70 to-pink-100/30",
  web: "from-blue-200/70 to-blue-100/30",
  brand: "from-amber-200/70 to-amber-100/30",
  presentation: "from-emerald-200/70 to-emerald-100/30",
  other: "from-gray-200/70 to-gray-100/30",
};

const CARD_HEIGHTS = ["h-40", "h-52", "h-44", "h-56", "h-48", "h-36", "h-60"];

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PreviewImage({ url, alt }: { url: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <div className="vm-shimmer absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className={`w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

function TintedPreview({ type, height }: { type: string; height: string }) {
  const gradient = TYPE_GRADIENT[type] ?? TYPE_GRADIENT.other;
  return (
    <div
      className={`${height} w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <Image
        src="/vimi-logo-dark.svg"
        alt=""
        width={100}
        height={32}
        className="h-6 w-auto opacity-20"
      />
    </div>
  );
}

export function PlaybookView({
  pieces,
  stats,
  activeClients,
}: {
  pieces: PlaybookPiece[];
  stats: PlaybookStats;
  activeClients: PlaybookClient[];
}) {
  const router = useRouter();
  const [clientFilter, setClientFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PlaybookPiece | null>(null);
  const [reuseSource, setReuseSource] = useState<PlaybookPiece | null>(null);
  const [reusing, setReusing] = useState(false);

  // Clients that actually have delivered work — each with its accent dot.
  const clientChips = useMemo(() => {
    const map = new Map<string, string>();
    pieces.forEach((p) => {
      if (!map.has(p.clientName)) map.set(p.clientName, p.clientAccent);
    });
    return Array.from(map.entries()).map(([name, accent]) => ({ name, accent }));
  }, [pieces]);

  // Types present in the data — chips only for what exists.
  const typeChips = useMemo(() => {
    const present = new Set(pieces.map((p) => p.type));
    return TYPE_ORDER.filter((t) => present.has(t));
  }, [pieces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pieces.filter((p) => {
      if (clientFilter !== "all" && p.clientName !== clientFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pieces, clientFilter, typeFilter, search]);

  async function confirmReuse(client: PlaybookClient) {
    if (!reuseSource || reusing) return;
    setReusing(true);
    const source = reuseSource;
    try {
      const res = await fetch("/api/portal/playbook/reuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_request_id: source.id,
          target_client_id: client.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error");

      setReuseSource(null);
      setSelected(null);
      toast.success(`Brief creado desde “${data.title}” en ${data.client_name}`, {
        action: {
          label: "Abrir",
          onClick: () => router.push(`/portal/requests/${data.request_id}`),
        },
      });
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo crear el brief"
      );
    } finally {
      setReusing(false);
    }
  }

  const hasPieces = pieces.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="space-y-6">
      {/* HERO + stats (Pareto: the counts that matter) */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h1 className="font-serif italic text-[30px] md:text-[38px] leading-tight tracking-tight text-[color:var(--vimi-ink)]">
            Playbook
          </h1>
          <p className="text-sm text-[color:var(--vimi-muted)] mt-2 leading-relaxed">
            Todo lo entregado, de todos los clientes — tu memoria de estudio.
            Reusa cualquier pieza como punto de partida.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          <Stat value={stats.deliveries} label="entregas" />
          <Stat value={stats.clients} label="clientes" />
          <Stat value={stats.reuses} label="veces reusado" />
        </div>
      </div>

      {hasPieces && (
        <>
          {/* FILTERS: client chips · divider · type chips · search (Hick's) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={clientFilter === "all"}
                onClick={() => setClientFilter("all")}
              >
                Todos
              </Chip>
              {clientChips.map((c) => (
                <Chip
                  key={c.name}
                  active={clientFilter === c.name}
                  onClick={() => setClientFilter(c.name)}
                >
                  <span
                    className="w-2 h-2 rounded-[3px] shrink-0"
                    style={{ background: c.accent }}
                  />
                  {c.name}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
              >
                TODO
              </Chip>
              {typeChips.map((t) => (
                <Chip
                  key={t}
                  active={typeFilter === t}
                  onClick={() => setTypeFilter(t)}
                >
                  {typeLabel(t)}
                </Chip>
              ))}

              <div className="relative ml-auto w-full sm:w-64">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--vimi-faint)]"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar entrega…"
                  className="w-full h-9 pl-9 pr-3 rounded-full border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] text-sm text-[color:var(--vimi-ink)] placeholder:text-[color:var(--vimi-faint)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30"
                />
              </div>
            </div>
          </div>

          {/* GRID (Jakob's: familiar masonry; Serial Position: newest first) */}
          {hasResults ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {filtered.map((piece, i) => (
                <PlaybookCard
                  key={piece.id}
                  piece={piece}
                  height={CARD_HEIGHTS[i % CARD_HEIGHTS.length]}
                  onOpen={() => setSelected(piece)}
                  onReuse={() => setReuseSource(piece)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[color:var(--vimi-muted)]">
              <p className="text-sm">
                Ninguna entrega coincide con esos filtros.
              </p>
            </div>
          )}
        </>
      )}

      {!hasPieces && (
        <div className="text-center py-20">
          <h2 className="font-serif italic text-2xl text-[color:var(--vimi-ink)]">
            Tu playbook se escribe solo.
          </h2>
          <p className="text-sm text-[color:var(--vimi-muted)] mt-2 max-w-sm mx-auto">
            Cada entrega aprobada aparece aquí automáticamente, lista para reusar
            en el próximo brief.
          </p>
        </div>
      )}

      {/* CARD DETAIL OVERLAY */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
          {selected && (
            <div className="max-h-[85vh] overflow-y-auto">
              <div className="relative bg-[color:rgba(28,27,31,0.03)]">
                {selected.previewUrl ? (
                  <PreviewImage url={selected.previewUrl} alt={selected.title} />
                ) : (
                  <TintedPreview type={selected.type} height="h-56" />
                )}
              </div>
              <div className="p-5 space-y-5">
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="font-serif italic text-2xl leading-tight text-[color:var(--vimi-ink)]">
                    {selected.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalle de la entrega {selected.title}
                  </DialogDescription>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold tracking-[0.06em] rounded-md px-2 py-0.5 ${TYPE_TINT[selected.type] ?? TYPE_TINT.other}`}
                    >
                      {typeLabel(selected.type)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--vimi-muted)]">
                      <span
                        className="w-2 h-2 rounded-[3px]"
                        style={{ background: selected.clientAccent }}
                      />
                      {selected.clientName}
                    </span>
                  </div>
                </DialogHeader>

                {/* Meta panel */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-[color:var(--vimi-border)] bg-[color:rgba(28,27,31,0.02)] p-4">
                  <Meta label="Diseñó" value={selected.assignee ?? "—"} />
                  <Meta label="Aprobado" value={formatDate(selected.approvedAt)} />
                  <Meta
                    label="Archivos"
                    value={
                      selected.fileCount === 0
                        ? "—"
                        : `${selected.fileCount}${
                            selected.totalSize > 0
                              ? ` · ${formatFileSize(selected.totalSize)}`
                              : ""
                          }`
                    }
                  />
                  <Meta
                    label="Reusado"
                    value={
                      selected.reuseCount > 0
                        ? `${selected.reuseCount}×`
                        : "Aún no"
                    }
                  />
                </dl>

                {/* REUSADO EN lineage (studio memory, not a scoreboard) */}
                {selected.reusedIn.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--vimi-faint)]">
                      Reusado en
                    </p>
                    <ul className="space-y-1.5">
                      {selected.reusedIn.map((r) => (
                        <li key={r.id}>
                          <Link
                            href={`/portal/requests/${r.id}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--vimi-border)] px-3 py-2 text-sm hover:bg-[color:rgba(28,27,31,0.03)] transition-colors"
                          >
                            <span className="min-w-0 truncate text-[color:var(--vimi-ink)]">
                              {r.title}
                            </span>
                            <span className="shrink-0 text-xs text-[color:var(--vimi-muted)]">
                              {r.client} · {formatDate(r.createdAt)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setReuseSource(selected)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                  >
                    ↻ Reusar como brief
                  </button>
                  {selected.previewUrl && (
                    <a
                      href={selected.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--vimi-border)] px-4 py-2 text-sm text-[color:var(--vimi-ink)] hover:bg-[color:rgba(28,27,31,0.03)] transition-colors"
                    >
                      <Download01Icon size={15} />
                      Descargar
                    </a>
                  )}
                  <Link
                    href={`/portal/requests/${selected.id}`}
                    className="inline-flex items-center gap-1 text-sm text-[color:var(--vimi-muted)] hover:text-[color:var(--vimi-ink)] transition-colors ml-auto"
                  >
                    Ver solicitud
                    <ArrowRight01Icon size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REUSE-AS-BRIEF: target-client picker */}
      <Dialog
        open={!!reuseSource}
        onOpenChange={(open) => !open && !reusing && setReuseSource(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif italic text-2xl text-[color:var(--vimi-ink)]">
              Reusar como brief
            </DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--vimi-muted)]">
              {reuseSource
                ? `Crea un nuevo brief desde “${reuseSource.title}”. ¿Para qué cliente?`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {activeClients.length > 0 ? (
            <div className="max-h-[50vh] overflow-y-auto space-y-1.5 -mx-1 px-1">
              {activeClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => confirmReuse(c)}
                  disabled={reusing}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] hover:border-[color:var(--vimi-ink)]/30 transition-colors text-left disabled:opacity-60"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-[4px] shrink-0"
                    style={{ background: c.accent }}
                  />
                  <span className="flex-1 text-sm font-medium text-[color:var(--vimi-ink)]">
                    {c.name}
                  </span>
                  <ArrowRight01Icon
                    size={15}
                    className="text-[color:var(--vimi-faint)]"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--vimi-muted)] py-4">
              No hay clientes activos para reusar este brief.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-right">
      <div className="font-serif text-[28px] md:text-[34px] leading-none text-[color:var(--vimi-ink)]">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--vimi-faint)] mt-1">
        {label}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-[color:var(--vimi-ink)] text-[var(--vimi-page)]"
          : "bg-[color:rgba(28,27,31,0.05)] text-[color:var(--vimi-muted)] hover:bg-[color:rgba(28,27,31,0.09)]"
      }`}
    >
      {children}
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--vimi-faint)]">
        {label}
      </dt>
      <dd className="text-sm text-[color:var(--vimi-ink)] truncate mt-0.5">
        {value}
      </dd>
    </div>
  );
}

function PlaybookCard({
  piece,
  height,
  onOpen,
  onReuse,
}: {
  piece: PlaybookPiece;
  height: string;
  onOpen: () => void;
  onReuse: () => void;
}) {
  return (
    <div className="break-inside-avoid rounded-[18px] border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] overflow-hidden vm-rise hover:shadow-[0_12px_28px_rgba(28,27,31,0.08)] transition-shadow">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left relative group"
      >
        <div className="relative overflow-hidden">
          {piece.previewUrl ? (
            <PreviewImage url={piece.previewUrl} alt={piece.title} />
          ) : (
            <TintedPreview type={piece.type} height={height} />
          )}

          {/* Reuse badge — the single salient mark (Von Restorff) */}
          {piece.reuseCount > 0 && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] text-[10px] font-bold tracking-[0.04em] px-2 py-1">
              ↻ {piece.reuseCount}× REUSADO
            </span>
          )}

          {/* Date pill */}
          <span className="absolute top-2 right-2 rounded-full bg-black/45 text-white text-[10px] font-medium px-2 py-0.5 backdrop-blur-sm">
            {formatDate(piece.approvedAt)}
          </span>
        </div>
      </button>

      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-[color:var(--vimi-ink)] line-clamp-2">
          {piece.title}
        </p>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold tracking-[0.06em] rounded-md px-1.5 py-0.5 ${TYPE_TINT[piece.type] ?? TYPE_TINT.other}`}
          >
            {typeLabel(piece.type)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--vimi-muted)] min-w-0">
            <span
              className="w-2 h-2 rounded-[3px] shrink-0"
              style={{ background: piece.clientAccent }}
            />
            <span className="truncate">{piece.clientName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={onReuse}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] px-2.5 py-1.5 text-xs font-semibold transition-transform hover:-translate-y-0.5"
          >
            ↻ Reusar como brief
          </button>
          <button
            onClick={onOpen}
            className="rounded-lg border border-[color:var(--vimi-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--vimi-ink)] hover:bg-[color:rgba(28,27,31,0.03)] transition-colors"
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  );
}
