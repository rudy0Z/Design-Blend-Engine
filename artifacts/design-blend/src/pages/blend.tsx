import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import { ArrowLeft, Download, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";

type SyncBlend = {
  userA: string;
  userB: string;
  versionA: number;
  versionB: number;
  blend: {
    score: number;
    similarity: number;
    perAxis: Array<{ key: string; a: number; b: number; delta: number; coverage: number }>;
    sharedPlates: Array<{
      plateId: string;
      styleId: string;
      label: string;
      imageUrl: string | null;
      valueA: number;
      valueB: number;
    }>;
    divergentPlates: Array<{
      plateId: string;
      styleId: string;
      label: string;
      imageUrl: string | null;
      valueA: number;
      valueB: number;
    }>;
    sharedDimensions: number;
    overallCoverage: number;
    modelVersion: string;
  };
};

export default function BlendPage() {
  const params = useParams<{ userA: string; userB: string }>();
  const { userA, userB } = params;
  const isSelfBlend = userA.toLowerCase() === userB.toLowerCase();
  const [exporting, setExporting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["blend-sync", userA, userB],
    queryFn: () => api<SyncBlend>(`/api/blends/${userA}/${userB}/sync`),
    enabled: !isSelfBlend && !!userA && !!userB,
  });
  const blend = data?.blend;

  if (isSelfBlend) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="font-semibold">You can't blend with yourself.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Share your profile with another designer to see how your tastes overlap.
            </p>
            <Link href={`/profile/${userA}`}>
              <Button className="mt-6">Back to profile</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  async function downloadCard() {
    const card = document.getElementById("blend-card");
    if (!card) return;
    setExporting(true);
    setActionMsg(null);
    try {
      const canvas = await html2canvas(card, { backgroundColor: null, scale: 2, useCORS: true });
      const a = document.createElement("a");
      a.download = `design-blend-${userA}-x-${userB}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      setActionMsg("Card downloaded.");
    } catch (err) {
      setActionMsg(`Couldn't export: ${(err as Error)?.message ?? "unknown"}`);
    } finally {
      setExporting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionMsg("Link copied to clipboard.");
    } catch {
      setActionMsg("Couldn't copy link.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-3 w-3" />
          <Link href={`/profile/${userA}`} className="hover:text-foreground">Profile</Link>
        </span>

        {isLoading && (
          <div className="flex items-center justify-center py-24" data-testid="blend-loading">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="text-center py-24 text-destructive" data-testid="blend-error">
            {(error as Error)?.message ?? "Couldn't load this blend."}
          </div>
        )}

        {blend && (
          <div className="mt-6 grid lg:grid-cols-[1fr_300px] gap-8">
            <div id="blend-card" className="rounded-2xl border border-border bg-card p-6 sm:p-8" data-testid="blend-card">
              <section className="text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Design Blend</div>
                <div className="mt-1 text-5xl sm:text-6xl font-serif font-bold" data-testid="blend-score">
                  {blend.score}%
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  @{data.userA} × @{data.userB} · {blend.sharedDimensions} shared dimensions ·
                  coverage {(blend.overallCoverage * 100).toFixed(0)}%
                </p>
              </section>

              {blend.sharedPlates.length > 0 && (
                <section className="mt-8">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Plates you both love
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {blend.sharedPlates.slice(0, 6).map((p) => (
                      <div key={p.plateId} className="rounded-xl overflow-hidden border border-border bg-muted" data-testid={`shared-${p.plateId}`}>
                        <div className="aspect-[4/3] bg-muted">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.label} className="w-full h-full object-cover" loading="eager" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
                              {p.label}
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1.5 text-center text-xs font-medium">
                          {p.valueA}% · {p.valueB}%
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {blend.divergentPlates.length > 0 && (
                <section className="mt-8">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Where you diverge
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {blend.divergentPlates.slice(0, 6).map((p) => (
                      <div key={p.plateId} className="rounded-xl overflow-hidden border border-border bg-muted" data-testid={`divergent-${p.plateId}`}>
                        <div className="aspect-[4/3] bg-muted">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.label} className="w-full h-full object-cover" loading="eager" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
                              {p.label}
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1.5 text-center text-xs font-medium">
                          {p.valueA}% vs {p.valueB}%
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Axis comparison
                </h3>
                <div className="space-y-2">
                  {blend.perAxis.map((ax) => (
                    <div key={ax.key} className="flex items-center gap-3 text-xs">
                      <span className="w-36 shrink-0 text-muted-foreground capitalize">
                        {ax.key.replace(/_/g, " ")}
                      </span>
                      <div className="relative h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="absolute h-2 rounded-full bg-primary/60"
                          style={{
                            left: `${Math.min(ax.a, ax.b)}%`,
                            width: `${Math.max(2, Math.abs(ax.a - ax.b))}%`,
                          }}
                          data-testid={`axis-bar-${ax.key}`}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono">{ax.a} ↔ {ax.b}</span>
                    </div>
                  ))}
                </div>
              </section>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Actions</h3>
                  <div className="flex flex-col gap-2">
                    <Button onClick={downloadCard} disabled={exporting} data-testid="button-download-blend">
                      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download card
                    </Button>
                    <Button variant="outline" onClick={copyLink} data-testid="button-copy-blend-link">
                      <Share2 className="h-4 w-4" /> Copy link
                    </Button>
                  </div>
                  {actionMsg && <p className="mt-3 text-xs text-muted-foreground">{actionMsg}</p>}
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    How this is computed
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Weighted cosine over the axes where both of you rated enough plates. Proof
                    plates come from the images you actually scored — never AI, never predicted.
                    Model {blend.modelVersion}.
                  </p>
                </div>
              </div>
            </div>
        )}
      </main>
    </div>
  );
}
