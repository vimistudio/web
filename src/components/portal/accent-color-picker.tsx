"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// The four Vimi Client Journey preset accents (see design prototype). The
// second, Vimi violet, is the studio default.
const PRESETS = [
  { hex: "#DA5B34", name: "Ember" },
  { hex: "#5B4BD6", name: "Vimi violet" },
  { hex: "#2E8B57", name: "Forest" },
  { hex: "#B03A5B", name: "Rosewood" },
];

const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());

export function AccentColorPicker({
  value,
  onChange,
  id = "client-accent",
}: {
  value: string;
  onChange: (hex: string) => void;
  id?: string;
}) {
  const current = value.trim();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Accent color</Label>
      <div className="flex items-center gap-3">
        {PRESETS.map((p) => {
          const selected = current.toLowerCase() === p.hex.toLowerCase();
          return (
            <button
              key={p.hex}
              type="button"
              onClick={() => onChange(p.hex)}
              title={p.name}
              aria-label={p.name}
              aria-pressed={selected}
              className="h-9 w-9 rounded-full transition-shadow"
              style={{
                background: p.hex,
                boxShadow: selected
                  ? `0 0 0 2px #fff, 0 0 0 4px ${p.hex}`
                  : "0 0 0 1px rgba(28,27,31,.12)",
              }}
            />
          );
        })}
        <Input
          id={id}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#5B4BD6"
          className={`ml-auto w-28 font-mono text-sm ${
            current && !isHex(current) ? "border-destructive" : ""
          }`}
        />
      </div>
    </div>
  );
}
