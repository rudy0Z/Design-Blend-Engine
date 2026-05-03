import { useRef, useState } from "react";
import { Link, useParams } from "wouter";
import html2canvas from "html2canvas";
import { Loader2, Download, Share2 } from "lucide-react";
import {
  useGetBlendByUsers,
  getGetBlendByUsersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { AXIS_DEFS } from "@/lib/fields";
import { usePageMeta } from "@/lib/meta";

export default function BlendPage() {
  const params = useParams<{ userA: string; userB: string }>();
  const { userA, userB } = params;
  const isSelfBlend = userA && userB && userA.toLowerCase() === userB.toLowerCase();
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  usePageMeta({
    title: `@${userA} × @${userB} — Design Blend`,
    description: "See how these two designers' tastes overlap and diverge.",
  });

  const { data: blend, isLoading, error } = useGetBlendByUsers(
    userA,
    userB,
    {
      query: {
        enabled: !!userA && !!userB && !isSelfBlend,
        queryKey: getGetBlendByUsersQueryKey(userA, userB),
      },
    },
  );

  if (isSelfBlend) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md" data-testid="text-self-blend">
            <p className="font-semibold text-foreground">
              You can't blend with yourself.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Send your invite link to another designer to see how your tastes overlap.
            </p>
            <Link href={`/profile/${userA}`}>
              <Button className="mt-6" data-testid="button-back-profile">
                Back to my profile
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  async function downloadCard() {
    if (!cardRef.current) return;
    setExporting(true);
    setActionMsg(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `design-blend-${userA}-x-${userB}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !blend) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-destructive font-semibold" data-testid="text-blend-error">
              Couldn't load this blend.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Both designers need a saved profile.
            </p>
            <Link href="/quiz">
              <Button className="mt-6" data-testid="button-take-quiz">
                Take the quiz
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // PRD: 0.6 → 0%, 1.0 → 100% display normalization (clamp).
  const displayPct = Math.round(
    Math.max(0, Math.min(1, (blend.similarity - 0.6) / 0.4)) * 100,
  );

  // Top 2 axes with biggest absolute delta = divergences.
  const axisOrdered = AXIS_DEFS.map((a) => {
    const delta = (blend.axisDeltas as Record<string, number>)[a.key] ?? 0;
    return { ...a, delta };
  }).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  const divergences = axisOrdered.slice(0, 2);
  const alignments = [...axisOrdered].slice(-3).reverse();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-sm text-muted-foreground tracking-wide uppercase mb-3">
            Blend
          </div>
          <h1
            className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground"
            data-testid="text-blend-title"
          >
            @{blend.usernameA} × @{blend.usernameB}
          </h1>

          <div className="mt-10 grid lg:grid-cols-[auto,1fr] gap-10 items-start">
            <div
              ref={cardRef}
              className="rounded-2xl overflow-hidden border border-border bg-card text-card-foreground"
              style={{ width: 540 }}
              data-testid="card-blend-export"
            >
              <div className="px-8 pt-8 pb-10 text-white relative bg-gradient-to-br from-[#ff5a36] to-[#a04dff]">
                <div className="text-xs uppercase tracking-[0.2em] opacity-80">Design Blend</div>
                <div className="mt-6 text-sm uppercase tracking-wider opacity-90">Blend score</div>
                <h2
                  className="mt-1 text-6xl font-serif font-bold leading-none"
                  data-testid="text-blend-score"
                >
                  {displayPct}%
                </h2>
                <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${displayPct}%` }}
                    data-testid="bar-blend-score"
                  />
                </div>
                <p className="mt-4 text-sm leading-relaxed opacity-95">
                  @{blend.usernameA} × @{blend.usernameB}
                </p>
              </div>

              <div className="p-8 space-y-7 bg-card">
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Where you align
                  </h3>
                  <div className="space-y-2">
                    {alignments.map((a) => (
                      <div
                        key={a.key}
                        className="flex justify-between text-sm"
                        data-testid={`row-align-${a.key}`}
                      >
                        <span className="text-foreground">
                          {a.left} ↔ {a.right}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          Δ {Math.round(Math.abs(a.delta))}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Where you diverge
                  </h3>
                  <div className="space-y-3">
                    {divergences.map((a) => {
                      const aLeans = a.delta > 0 ? a.right : a.left;
                      const bLeans = a.delta > 0 ? a.left : a.right;
                      return (
                        <div key={a.key} data-testid={`row-diverge-${a.key}`}>
                          <div className="text-sm text-foreground font-medium">
                            {a.left} ↔ {a.right}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                            <span>@{blend.usernameA}: {aLeans}</span>
                            <span>@{blend.usernameB}: {bLeans}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {blend.sharedStyles.length > 0 && (
                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                      Shared design DNA
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {blend.sharedStyles.slice(0, 6).map((s) => (
                        <span
                          key={s.nodeId}
                          className="rounded-full px-3 py-1 text-xs font-medium border border-border bg-muted text-foreground"
                          data-testid={`pill-shared-${s.nodeId}`}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Collaboration
                  </h3>
                  <p className="text-sm italic text-foreground" data-testid="text-collab-line">
                    {blend.collaborationLine}
                  </p>
                </section>

                <div className="pt-2 border-t border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  designblend.app
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={downloadCard}
                    disabled={exporting}
                    data-testid="button-download-blend"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download card
                  </Button>
                  <Button variant="outline" onClick={copyLink} data-testid="button-copy-blend-link">
                    <Share2 className="h-4 w-4" />
                    Copy link
                  </Button>
                </div>
                {actionMsg && (
                  <p className="mt-3 text-xs text-muted-foreground" data-testid="text-action-msg">
                    {actionMsg}
                  </p>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Cosine similarity: {blend.similarity.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
