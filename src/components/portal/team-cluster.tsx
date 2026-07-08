"use client";

export interface ClusterMember {
  fullName: string | null;
  avatarUrl: string | null;
}

const initialOf = (name: string | null) =>
  name?.trim().charAt(0).toUpperCase() || "V";

/**
 * Overlapping avatar cluster for a client's studio crew. Presentational only —
 * the "{n} people on your project" caption is rendered by the caller (it needs
 * the caller's locale). Extra members past `max` collapse into a "+N" chip.
 */
export function TeamAvatarCluster({
  members,
  accent = "var(--accent)",
  max = 4,
  size = 24,
}: {
  members: ClusterMember[];
  accent?: string;
  max?: number;
  size?: number;
}) {
  if (members.length === 0) return null;
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  const dim = `${size}px`;
  const font = `${Math.round(size * 0.42)}px`;

  return (
    <div className="flex items-center" aria-hidden="true">
      {shown.map((m, i) =>
        m.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={m.avatarUrl}
            alt=""
            className="rounded-full object-cover ring-2 ring-white"
            style={{ width: dim, height: dim, marginLeft: i === 0 ? 0 : -size * 0.3 }}
          />
        ) : (
          <span
            key={i}
            className="rounded-full text-white flex items-center justify-center font-bold ring-2 ring-white"
            style={{
              width: dim,
              height: dim,
              fontSize: font,
              background: accent,
              marginLeft: i === 0 ? 0 : -size * 0.3,
            }}
          >
            {initialOf(m.fullName)}
          </span>
        )
      )}
      {extra > 0 && (
        <span
          className="rounded-full bg-[color:rgba(28,27,31,0.1)] text-[color:var(--vimi-ink)] flex items-center justify-center font-bold ring-2 ring-white"
          style={{ width: dim, height: dim, fontSize: font, marginLeft: -size * 0.3 }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
