"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { AccentColorPicker } from "./accent-color-picker";

interface Client {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
  locale?: string | null;
  logo_url?: string | null;
  accent_color?: string | null;
}

export function EditClientDialog({ client }: { client: Client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [slug, setSlug] = useState(client.slug);
  const [retainer, setRetainer] = useState(client.retainer_amount ?? 0);
  const [isActive, setIsActive] = useState(client.is_active);
  const [locale, setLocale] = useState(client.locale ?? "en");
  const [logoUrl, setLogoUrl] = useState(client.logo_url ?? "");
  const [accentColor, setAccentColor] = useState(client.accent_color ?? "#5B4BD6");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        retainer_amount: retainer,
        is_active: isActive,
        locale,
        logo_url: logoUrl.trim() || null,
        accent_color: accentColor.trim() || null,
      })
      .eq("id", client.id);

    if (error) {
      toast.error("Couldn't save changes. Please try again.");
      setIsSaving(false);
      return;
    }

    toast.success("Client updated");
    setIsSaving(false);
    setOpen(false);

    // If slug changed, redirect to new URL
    const newSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (newSlug !== client.slug) {
      router.push(`/portal/admin/clients/${newSlug}`);
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings02Icon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (slug === client.slug) {
                  setSlug(
                    e.target.value
                      .trim()
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")
                  );
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-slug">URL Slug</Label>
            <Input
              id="client-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-retainer">Monthly Retainer ($)</Label>
            <Input
              id="client-retainer"
              type="number"
              value={retainer}
              onChange={(e) => setRetainer(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-locale">Language</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="client-locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white border shadow-lg z-50">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-logo">Logo URL</Label>
            <Input
              id="client-logo"
              type="url"
              placeholder="https://…/logo.svg"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
          <AccentColorPicker value={accentColor} onChange={setAccentColor} />
          <div className="flex items-center justify-between">
            <Label htmlFor="client-active">Active</Label>
            <Switch
              id="client-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
