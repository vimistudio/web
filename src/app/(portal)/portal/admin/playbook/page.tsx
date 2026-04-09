import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default async function AdminPlaybookPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal");

  // Fetch all completed requests across clients
  const { data: completed } = await supabase
    .from("requests")
    .select("*, clients(name, slug), deliverables(id, file_name, file_path)")
    .eq("status", "done")
    .order("updated_at", { ascending: false });

  const typeColors: Record<string, string> = {
    logo: "bg-purple-100 text-purple-700",
    social: "bg-pink-100 text-pink-700",
    web: "bg-blue-100 text-blue-700",
    brand: "bg-amber-100 text-amber-700",
    presentation: "bg-emerald-100 text-emerald-700",
    other: "bg-gray-100 text-gray-700",
  };

  const gradients: Record<string, string> = {
    logo: "from-purple-200 to-purple-100",
    social: "from-pink-200 to-pink-100",
    web: "from-blue-200 to-blue-100",
    brand: "from-amber-200 to-amber-100",
    presentation: "from-emerald-200 to-emerald-100",
    other: "from-gray-200 to-gray-100",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Playbook</h1>
        <p className="text-sm text-muted-foreground">
          All completed work across your clients.
        </p>
      </div>

      {(completed ?? []).length > 0 ? (
        <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {(completed ?? []).map((request, i) => {
            const heights = ["h-40", "h-52", "h-44", "h-56", "h-48"];
            const height = heights[i % heights.length];
            const gradient = gradients[request.type] ?? gradients.other;
            const client = request.clients as { name: string; slug: string } | null;

            return (
              <Card
                key={request.id}
                className="break-inside-avoid overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className={`${height} bg-gradient-to-b ${gradient} relative flex items-center justify-center`}
                >
                  <Image
                    src="/vimi-logo-dark.svg"
                    alt=""
                    width={100}
                    height={32}
                    className="h-6 w-auto opacity-20"
                  />
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="text-sm font-medium">{request.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
                    >
                      {request.type.toUpperCase()}
                    </Badge>
                    {client && (
                      <span className="text-xs text-muted-foreground">
                        {client.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          No completed work yet. Deliverables will appear here as you finish
          requests.
        </div>
      )}
    </div>
  );
}
