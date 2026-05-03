import { forwardRef } from "react";
import type { Profile } from "@workspace/api-client-react";
import { AxisRadar } from "./AxisRadar";
import { AXIS_DEFS, FIELD_LABEL } from "@/lib/fields";

export const ProfileCard = forwardRef<HTMLDivElement, { profile: Profile }>(
  function ProfileCard({ profile }, ref) {
    const accent = profile.archetypeColor || "#ff5a36";
    const fieldEntries = Object.entries(profile.fieldDistribution ?? {});

    return (
      <div
        ref={ref}
        className="rounded-2xl overflow-hidden border border-border bg-card text-card-foreground"
        style={{ width: 540 }}
        data-testid="card-profile-export"
      >
        <div
          className="px-8 pt-8 pb-10 text-white relative"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${shade(accent, -25)} 100%)`,
          }}
        >
          <div className="text-xs uppercase tracking-[0.2em] opacity-80">Design Blend</div>
          <div className="mt-6 text-sm uppercase tracking-wider opacity-90">You are</div>
          <h2
            className="mt-1 text-4xl font-serif font-bold leading-tight"
            data-testid="text-archetype-title"
          >
            {profile.archetypeTitle}
          </h2>
          <p
            className="mt-4 text-sm leading-relaxed opacity-95 max-w-md"
            data-testid="text-archetype-description"
          >
            {profile.archetypeDescription}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span data-testid="text-username">@{profile.username}</span>
          </div>
        </div>

        <div className="p-8 space-y-7 bg-card">
          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Taste Fingerprint
            </h3>
            <AxisRadar axes={profile.axes} color={accent} />
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {AXIS_DEFS.map((a) => {
                const v = (profile.axes as unknown as Record<string, number>)[a.key] ?? 50;
                return (
                  <div key={a.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{a.left} ↔ {a.right}</span>
                    <span className="font-mono text-foreground" data-testid={`text-axis-${a.key}`}>
                      {Math.round(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {profile.topStyles?.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Design DNA
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.topStyles.slice(0, 8).map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1 text-xs font-medium border"
                    style={{
                      borderColor: `${accent}55`,
                      background: `${accent}10`,
                      color: accent,
                    }}
                    data-testid={`pill-top-style-${s}`}
                  >
                    {prettify(s)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {fieldEntries.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Field Affinity
              </h3>
              <div className="space-y-2">
                {fieldEntries.map(([field, value]) => (
                  <div key={field} data-testid={`row-field-${field}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">
                        {FIELD_LABEL[field] ?? field}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {Math.round(value)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, value))}%`,
                          background: accent,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>designblend.app</span>
            <span>Confidence {Math.round((profile.confidence ?? 0) * 100)}%</span>
          </div>
        </div>
      </div>
    );
  },
);

function prettify(id: string): string {
  return id
    .replace(/^(ui|gd)[_-]/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shade(hex: string, percent: number): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length !== 3) return hex;
  const [r, g, b] = m.map((h) => parseInt(h, 16));
  const adj = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (percent / 100) * 255)));
  return `#${[adj(r), adj(g), adj(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}
