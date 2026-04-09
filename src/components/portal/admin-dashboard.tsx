"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  counts: {
    queued: number;
    in_progress: number;
    review: number;
    done: number;
  };
}

interface Stats {
  totalClients: number;
  openRequests: number;
  needsReview: number;
  monthlyRevenue: number;
}

interface Activity {
  id: string;
  body: string;
  created_at: string;
  request_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  requests: { id: string; title: string; client_id: string } | null;
}

interface AdminDashboardProps {
  stats: Stats;
  clients: ClientSummary[];
  recentActivity: Activity[];
  adminName?: string;
}

const statCards = [
  { key: "totalClients" as const, label: "ACTIVE CLIENTS", icon: UserGroupIcon, color: "text-foreground" },
  { key: "openRequests" as const, label: "OPEN REQUESTS", icon: Task01Icon, color: "text-blue-600" },
  { key: "needsReview" as const, label: "NEEDS REVIEW", icon: ViewIcon, color: "text-amber-500" },
  { key: "monthlyRevenue" as const, label: "MONTHLY REVENUE", icon: DollarCircleIcon, color: "text-emerald-500" },
];

const statusPills = [
  { key: "queued" as const, label: "Queued", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  { key: "in_progress" as const, label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  { key: "review" as const, label: "Review", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  { key: "done" as const, label: "Done", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
];

function ClientCard({ client }: { client: ClientSummary }) {
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
                <AvatarFallback className="bg-[#909af7] text-white font-semibold text-sm">
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-xs text-muted-foreground">
                  ${client.retainer_amount ?? 0}/mo · {openCount} open
                </p>
              </div>
            </div>
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

export function AdminDashboard({ stats, clients, recentActivity, adminName }: AdminDashboardProps) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}{adminName ? `, ${adminName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{dateStr}</p>
        </div>
        <Link href="/portal/admin/clients">
          <Button variant="outline" className="gap-2">
            <PlusSignIcon size={16} />
            New Client
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const value = stats[card.key];
          const display = card.key === "monthlyRevenue" ? `$${value.toLocaleString()}` : value;
          return (
            <Card key={card.key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground tracking-wider">
                    {card.label}
                  </p>
                  <card.icon size={16} className="text-muted-foreground/50" />
                </div>
                <p className={`text-3xl font-semibold mt-2 ${card.color}`}>
                  {display}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clients Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Clients</h2>
          <Link
            href="/portal/admin/clients"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
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
                    <AvatarFallback className="bg-[#909af7]/20 text-[#909af7] text-[10px] font-medium">
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
                      </span>{" "}
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
                No recent activity yet. Activity will appear here when clients
                submit requests and leave comments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
