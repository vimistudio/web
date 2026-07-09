"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserGroupIcon,
  Task01Icon,
  ViewIcon,
  DollarCircleIcon,
  ArrowRight01Icon,
  PlusSignIcon,
  Comment01Icon,
} from "@/components/ui/icons";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { usePricePrivacy, maskPrice, PRICE_MASK } from "@/hooks/use-price-privacy";
import { useWorkScope } from "@/hooks/use-work-scope";
import { AssigneeAvatar, type Admin } from "./assignee-control";

interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  logo_url?: string | null;
  designer_id?: string | null;
  counts: {
    queued: number;
    in_progress: number;
    review: number;
    done: number;
  };
  hotRequests?: { id: string; title: string; status: string }[];
  lastActiveAt?: string | null;
}

interface Stats {
  totalClients: number;
  openRequests: number;
  needsReview: number;
  monthlyRevenue: number;
  activeClientCount: number;
}

interface Activity {
  id: string;
  body: string;
  created_at: string;
  request_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  requests: { id: string; title: string; client_id: string; clients: { name: string } | null } | null;
}

type AttentionKind = "review" | "overdue" | "owed";

interface AttentionItem {
  id: string;
  kind: AttentionKind;
  clientName: string;
  clientColor: string;
  text: string;
  href: string;
  mine?: boolean;
}

interface AdminDashboardProps {
  stats: Stats;
  clients: ClientSummary[];
  recentActivity: Activity[];
  attention?: AttentionItem[];
  adminName?: string;
  adminId?: string;
  admins?: Admin[];
}

const attentionConfig: Record<
  AttentionKind,
  { badge: string; badgeBg: string; badgeColor: string; border: string; cta: string }
> = {
  review: {
    badge: "REVIEW",
    badgeBg: "var(--status-review-chip)",
    badgeColor: "var(--status-review-ink)",
    border: "rgba(201,130,27,0.40)",
    cta: "Review",
  },
  overdue: {
    badge: "OVERDUE",
    badgeBg: "#FBEAEE",
    badgeColor: "#B03A5B",
    border: "rgba(176,58,91,0.40)",
    cta: "Open",
  },
  owed: {
    badge: "AWAITING CLIENT",
    badgeBg: "#F1EEFB",
    badgeColor: "#5B4BD6",
    border: "rgba(91,75,214,0.35)",
    cta: "View",
  },
};

function AttentionRow({ item }: { item: AttentionItem }) {
  const cfg = attentionConfig[item.kind];
  return (
    <div
      className="rounded-2xl border-[1.5px] bg-[var(--vimi-card)] px-4 sm:px-5 py-3.5 flex items-center gap-3 flex-wrap"
      style={{ borderColor: cfg.border }}
    >
      <span
        className="w-2.5 h-2.5 rounded-[4px] shrink-0"
        style={{ background: item.clientColor }}
      />
      <span className="text-[13px] font-bold text-[color:var(--vimi-ink)] shrink-0">
        {item.clientName}
      </span>
      <span className="text-[13.5px] text-[color:var(--vimi-muted)] flex-1 min-w-[180px]">
        {item.text}
      </span>
      <span
        className="text-[11px] font-bold tracking-[0.06em] rounded-md px-2 py-1 shrink-0"
        style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
      >
        {cfg.badge}
      </span>
      <Link href={item.href} className="shrink-0">
        <button className="inline-flex items-center bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 min-h-[36px]">
          {cfg.cta}
        </button>
      </Link>
    </div>
  );
}

const statCards = [
  { key: "totalClients" as const, label: "ACTIVE CLIENTS", icon: UserGroupIcon, color: "text-[color:var(--vimi-ink)]", subtitle: undefined },
  { key: "openRequests" as const, label: "OPEN REQUESTS", icon: Task01Icon, color: "text-blue-600", subtitle: "across active clients" },
  { key: "needsReview" as const, label: "NEEDS REVIEW", icon: ViewIcon, color: "text-amber-500", subtitle: "across active clients" },
  { key: "monthlyRevenue" as const, label: "MONTHLY REVENUE", icon: DollarCircleIcon, color: "text-emerald-600", subtitle: undefined },
];

const statusPills = [
  { key: "queued" as const, label: "Up Next", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  { key: "in_progress" as const, label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  { key: "review" as const, label: "Ready for Review", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  { key: "done" as const, label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
];

function ClientCard({ client, admins }: { client: ClientSummary; admins: Admin[] }) {
  const { hidden: pricesHidden } = usePricePrivacy();
  const totalRequests = client.counts.queued + client.counts.in_progress + client.counts.review + client.counts.done;
  const completedPercent = totalRequests > 0 ? Math.round((client.counts.done / totalRequests) * 100) : 0;
  const openCount = client.counts.queued + client.counts.in_progress + client.counts.review;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <CardContent className="p-0">
        <div className="p-5 sm:p-6">
          {/* Top row: name + badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {client.logo_url && (
                  <AvatarImage src={client.logo_url} alt={client.name} className="object-contain" />
                )}
                <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {maskPrice(`$${client.retainer_amount ?? 0}`, pricesHidden)}/mo · {openCount} open
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <AssigneeAvatar assigneeId={client.designer_id} admins={admins} />
              <Badge
                variant="outline"
                className={
                  client.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }
              >
                {client.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-2 flex-wrap mb-4">
            {statusPills.map((s) => {
              const count = client.counts[s.key];
              if (count === 0 && s.key === "queued") return null;
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {count} {s.label}
                </div>
              );
            })}
          </div>

          {/* Hot requests */}
          {client.hotRequests && client.hotRequests.length > 0 && (
            <div className="mt-2 mb-4 space-y-1">
              {client.hotRequests.slice(0, 2).map((r) => (
                <Link key={r.id} href={`/portal/requests/${r.id}`} className="block text-xs text-primary hover:underline truncate">
                  {r.title}
                </Link>
              ))}
            </div>
          )}

          {/* Last active indicator */}
          {client.lastActiveAt && (() => {
            const daysAgo = Math.floor(
              (Date.now() - new Date(client.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            const isInactive = daysAgo >= 14;
            const isWarning = daysAgo >= 7 && daysAgo < 14;
            return (
              <p className={`text-[11px] mb-4 ${isInactive ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"}`}>
                {daysAgo === 0
                  ? "Active today"
                  : daysAgo === 1
                  ? "Active yesterday"
                  : isInactive
                  ? `Inactive ${daysAgo} days`
                  : `Active ${daysAgo} days ago`}
              </p>
            );
          })()}

          {/* Progress bar */}
          {totalRequests > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{completedPercent}% delivered</span>
                <span>{client.counts.done}/{totalRequests} requests</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                {client.counts.done > 0 && (
                  <div
                    className="bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(client.counts.done / totalRequests) * 100}%` }}
                  />
                )}
                {client.counts.review > 0 && (
                  <div
                    className="bg-amber-400"
                    style={{ width: `${(client.counts.review / totalRequests) * 100}%` }}
                  />
                )}
                {client.counts.in_progress > 0 && (
                  <div
                    className="bg-blue-400"
                    style={{ width: `${(client.counts.in_progress / totalRequests) * 100}%` }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => {
                document.cookie = `impersonate_client=${client.id}; path=/; max-age=3600`;
                window.location.href = "/portal";
              }}
            >
              View as Client
            </Button>
            <Link href={`/portal/admin/clients/${client.slug}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Open Board
                <ArrowRight01Icon size={12} />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({ stats, clients, recentActivity, attention = [], adminName, adminId, admins = [] }: AdminDashboardProps) {
  const { hidden: pricesHidden } = usePricePrivacy();
  const { scope, setScope } = useWorkScope();
  const [showPaused, setShowPaused] = useState(false);
  // Solo-admin mode: one-person studio → no "mine vs everyone" scope toggle.
  const solo = admins.length <= 1;
  const activeClients = clients.filter((c) => c.is_active);
  const pausedClients = clients.filter((c) => !c.is_active);
  // Mine-first ordering (never hide): my clients bubble up, everyone else follows.
  const mineFirst = (list: ClientSummary[]) =>
    [...list].sort(
      (a, b) =>
        Number(b.designer_id === adminId) - Number(a.designer_id === adminId)
    );
  const visibleClients = showPaused
    ? [...mineFirst(activeClients), ...mineFirst(pausedClients)]
    : mineFirst(activeClients);

  // Attention strip respects the shared work scope; a quiet toggle flips it.
  const mineAttentionCount = attention.filter((i) => i.mine).length;
  const scopedAttention =
    scope === "mine" && !solo ? attention.filter((i) => i.mine) : attention;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = adminName ? adminName.split(" ")[0] : "";
  const dateEyebrow = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  return (
    <div className="space-y-8">
      {/* Hero — matches the client board hero language */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2 md:gap-2.5">
          <div className="text-[11px] md:text-xs font-semibold tracking-[0.12em] text-[color:var(--vimi-faint)]">
            {dateEyebrow}
          </div>
          <h1 className="font-serif italic text-[30px] md:text-[40px] leading-[1.08] tracking-tight text-[color:var(--vimi-ink)]">
            {greeting}{firstName ? `, ${firstName}` : ""}.
          </h1>
        </div>
        <Link href="/portal/admin/clients" className="shrink-0">
          <button className="inline-flex items-center gap-2 bg-[color:var(--vimi-ink)] text-[var(--vimi-page)] rounded-full px-5 py-3 text-sm font-semibold shadow-[0_10px_26px_rgba(28,27,31,0.22)] transition-transform hover:-translate-y-0.5 min-h-[44px]">
            <PlusSignIcon size={16} color="currentColor" />
            New Client
          </button>
        </Link>
      </div>

      {/* Stats Grid — journey card language */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const value = stats[card.key];
          const display =
            card.key === "monthlyRevenue"
              ? maskPrice(`$${value.toLocaleString()}`, pricesHidden)
              : value;
          return (
            <div
              key={card.key}
              className="rounded-2xl border border-[color:var(--vimi-border)] bg-[var(--vimi-card)] p-5 shadow-[0_2px_8px_rgba(28,27,31,0.04)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-[color:var(--vimi-faint)] tracking-[0.12em]">
                  {card.label}
                </p>
                <card.icon size={16} className="text-[color:var(--vimi-faint)]" />
              </div>
              <p className={`text-3xl font-semibold mt-2 ${card.color}`}>
                {display}
              </p>
              {card.key === "monthlyRevenue" ? (
                <p className="text-xs text-[color:var(--vimi-muted)] mt-1">
                  {pricesHidden
                    ? `${PRICE_MASK} active clients`
                    : `${stats.activeClientCount} active ${stats.activeClientCount === 1 ? "client" : "clients"}`}
                </p>
              ) : (
                card.subtitle && (
                  <p className="text-xs text-[color:var(--vimi-muted)] mt-1">
                    {card.subtitle}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Needs attention (Pareto) — hidden entirely when nothing needs action */}
      {attention.length > 0 && (
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--vimi-ink)]">
                Needs attention
              </h2>
              <p className="text-sm text-[color:var(--vimi-muted)] mt-0.5">
                The 20% that matters today. Everything else can wait.
              </p>
            </div>
            {!solo && (
              <button
                onClick={() => setScope(scope === "mine" ? "everyone" : "mine")}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline mt-1"
              >
                {scope === "mine"
                  ? `Show everyone's (${attention.length})`
                  : `Show mine (${mineAttentionCount})`}
              </button>
            )}
          </div>
          {scopedAttention.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {scopedAttention.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--vimi-muted)]">
              Nothing assigned to you needs action right now.
            </p>
          )}
        </div>
      )}

      {/* Clients Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Clients</h2>
          <div className="flex items-center gap-4">
            {pausedClients.length > 0 && (
              <button
                onClick={() => setShowPaused((v) => !v)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                {showPaused ? "Hide paused" : `Show paused (${pausedClients.length})`}
              </button>
            )}
            <Link
              href="/portal/admin/clients"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleClients.map((client) => (
            <ClientCard key={client.id} client={client} admins={admins} />
          ))}

          {clients.length === 0 && (
            <Card className="border-dashed md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No clients yet</p>
                <Button variant="outline" className="gap-2">
                  <PlusSignIcon size={16} />
                  Add your first client
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6 divide-y">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/portal/requests/${activity.requests?.id ?? activity.request_id}`}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-medium">
                      {(activity.profiles?.full_name ?? "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.profiles?.full_name ?? "Someone"}
                      </span>
                      {activity.requests?.clients?.name && (
                        <>
                          {" "}
                          <span className="text-muted-foreground/60 text-xs">
                            ({activity.requests.clients.name})
                          </span>
                        </>
                      )}
                      {" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-medium">
                        {activity.requests?.title ?? "a request"}
                      </span>
                    </p>
                    {activity.body && (
                      <div className="flex items-start gap-1.5 mt-1">
                        <Comment01Icon size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.body.length > 120
                            ? activity.body.slice(0, 120) + "..."
                            : activity.body}
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity from active clients.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
