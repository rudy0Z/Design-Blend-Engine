import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Copy,
  Lock,
  Plus,
  Share2,
  Sparkles,
  Unlock,
} from "lucide-react";
import { CRITIQUE_TAGS } from "@workspace/taste-engine";
import { Header } from "@/components/Header";
import { AxisRuler } from "@/components/AxisRuler";
import { PlateSpecimen } from "@/components/PlateSpecimen";
import {
  STUDIO_CATALOG,
  createStudioInvite,
  getActiveHandle,
  getArchetypeDetails,
  getDesignerProfile,
  getProfileDrift,
  listPublicDesigners,
  setActiveHandle,
  toggleProfilePrivacy,
} from "@/lib/backend-provider";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { username = "" } = useParams<{ username: string }>();
  const [refreshTick, setRefreshTick] = useState(0);
  const record = useMemo(
    () => getDesignerProfile(username),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, refreshTick],
  );

  const [selectedVerIdx, setSelectedVerIdx] = useState<number | null>(null);
  const [activeWorld, setActiveWorld] = useState<string>("global");
  const [inviteCopied, setInviteCopied] = useState<string | null>(null);

  const platesById = useMemo(
    () => new Map(STUDIO_CATALOG.plates.map((p) => [p.id, p])),
    [],
  );
  const fieldLabels = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of STUDIO_CATALOG.fields) m.set(f.id, f.label);
    return m;
  }, []);

  if (!record) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            @{username} hasn&apos;t minted a Taste Card yet.
          </h1>
          <Link
            href="/capture"
            className="tactile-pill px-7 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center"
          >
            Create @{username}&apos;s Taste Card
          </Link>
        </main>
      </div>
    );
  }

  const verIdx = selectedVerIdx ?? record.versions.length - 1;
  const snapshot = record.versions[verIdx] ?? record.versions[record.versions.length - 1];
  const data = snapshot.data;
  const arch = getArchetypeDetails(data.archetype.id);
  const drift = getProfileDrift(record);
  const activeUser = getActiveHandle();
  const isOwner = activeUser === record.username || !record.isSeededDemo;
  const otherDesigners = listPublicDesigners().filter((d) => d.username !== record.username);
  const aura = data.auraColors ?? ["#FF5A36", "#F59E0B", "#FB7185"];

  const displayedAxes =
    activeWorld !== "global" && data.fieldSlices[activeWorld]
      ? data.fieldSlices[activeWorld].axes
      : data.axes;

  function handleSendBlendInvite() {
    const token = createStudioInvite(record!.username);
    const url = `${window.location.origin}/blend/invite/${token}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setInviteCopied(url);
    setTimeout(() => setInviteCopied(null), 4000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 relative">
        {/* Ambient Generative Taste Aura Backdrop */}
        <div
          style={{
            background: `radial-gradient(520px circle at 25% 12%, ${aura[0]}33, transparent 70%), radial-gradient(460px circle at 78% 18%, ${aura[1]}29, transparent 70%)`,
          }}
          className="pointer-events-none absolute inset-x-0 top-0 h-[440px] -z-10 blur-2xl"
        />

        {/* ==================================================================
            HERO TASTE PASS + BLEND INVITE TICKET
            ================================================================== */}
        <section className="slide-housing p-6 sm:p-9 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  style={{ background: `linear-gradient(135deg, ${aura[0]}, ${aura[1]})` }}
                  className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm"
                >
                  @{record.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {record.disciplineLine}
                  {record.location ? ` · ${record.location}` : ""}
                </span>

                {record.versions.length > 1 && (
                  <div className="flex items-center gap-1 ml-auto">
                    {record.versions.map((v, idx) => (
                      <button
                        key={v.version}
                        type="button"
                        onClick={() => setSelectedVerIdx(idx)}
                        className={cn(
                          "spring-tap px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          verIdx === idx
                            ? "bg-foreground text-background"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        v{v.version}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-primary mb-1">Creative Signature</div>
                <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[0.98]">
                  {arch.title}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                {arch.description}
              </p>

              {data.creativeRange.hasDuality && (
                <div className="rounded-2xl bg-secondary/75 p-4 flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <strong className="text-foreground">Multi-world range: </strong>
                    <span className="text-muted-foreground">{data.creativeRange.summary}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Tactile Blend Ticket Stub */}
            <div className="lg:col-span-5 rounded-3xl bg-secondary/65 p-5 sm:p-6 space-y-4 border border-foreground/10">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    background: `conic-gradient(from 45deg, ${aura[0]}, ${aura[1]}, ${aura[2]}, ${aura[0]})`,
                  }}
                  className="h-14 w-14 rounded-2xl shadow-md shrink-0"
                />
                <div>
                  <div className="font-display font-bold text-lg leading-snug">
                    Blend with {record.displayName}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send an invite link to merge your taste into a 5-card story.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendBlendInvite}
                data-testid="button-copy-invite"
                className="tactile-pill w-full h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center justify-center gap-2"
              >
                {inviteCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>
                  {inviteCopied ? "Blend Link Copied!" : "Copy Blend Invite Link"}
                </span>
              </button>

              {inviteCopied && (
                <div className="rounded-xl bg-background/80 px-3 py-2 font-mono text-[11px] text-muted-foreground truncate flex items-center justify-between gap-2">
                  <span className="truncate">{inviteCopied}</span>
                  <Copy className="h-3.5 w-3.5 shrink-0 text-primary" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/capture"
                  onClick={() => setActiveHandle(record.username)}
                  className="spring-tap h-10 rounded-full bg-card text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add more picks
                </Link>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleProfilePrivacy(record.username, !record.isPublic);
                      setRefreshTick((t) => t + 1);
                    }}
                    className="spring-tap h-10 rounded-full bg-card text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    {record.isPublic ? (
                      <>
                        <Unlock className="h-3.5 w-3.5 text-emerald-400" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" /> Private
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* One-Tap Blend With Community Creatives */}
          <div className="mt-7 pt-5 border-t border-border/70 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Instant Blend with:</span>
            {otherDesigners.map((other) => {
              const otherAura =
                other.versions[other.versions.length - 1]?.data.auraColors ?? [
                  "#38BDF8",
                  "#818CF8",
                  "#2DD4BF",
                ];
              return (
                <Link
                  key={other.username}
                  href={`/blend/${record.username}/${other.username}`}
                  className="spring-tap pl-2 pr-3.5 py-1.5 rounded-full bg-secondary hover:bg-accent text-xs font-semibold inline-flex items-center gap-2"
                >
                  <span
                    style={{ background: `linear-gradient(135deg, ${otherAura[0]}, ${otherAura[1]})` }}
                    className="h-4 w-4 rounded-full"
                  />
                  <span>{other.displayName}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Taste Evolution Timeline Banner if v2+ */}
        {drift && (
          <section className="slide-housing p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-primary">
                Taste Evolution · v{record.versions.length - 1} → v{record.versions.length}
              </div>
              <div className="font-display font-bold text-lg">{drift.summary}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {drift.movedAxes.slice(0, 3).map((m) => (
                <span
                  key={m.key}
                  className="px-3 py-1 rounded-full bg-secondary text-xs font-medium tabular-nums"
                >
                  {m.label}: {m.delta > 0 ? `+${m.delta}` : m.delta} toward {m.directionPole}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================================
            HOW THEIR EYE MOVES ACROSS WORLDS (FADERS + GUT NOTES)
            ================================================================== */}
        <section className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 slide-housing p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-2xl">How your eye is tuned</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Switch worlds to see how your instincts shift from space to screen.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveWorld("global")}
                  className={cn(
                    "spring-tap px-3 py-1 rounded-full text-xs font-semibold",
                    activeWorld === "global"
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  All Worlds
                </button>
                {Object.keys(data.fieldSlices).map((fId) => (
                  <button
                    key={fId}
                    type="button"
                    onClick={() => setActiveWorld(fId)}
                    className={cn(
                      "spring-tap px-3 py-1 rounded-full text-xs font-semibold",
                      activeWorld === fId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {fieldLabels.get(fId)?.split(" ")[0] ?? fId}
                  </button>
                ))}
              </div>
            </div>

            {activeWorld !== "global" && data.fieldSlices[activeWorld] && (
              <div className="rounded-2xl bg-secondary/70 px-4 py-2.5 text-xs flex items-center justify-between">
                <span>
                  In <strong>{fieldLabels.get(activeWorld) ?? activeWorld}</strong>, you lean{" "}
                  <strong className="text-primary">
                    {data.fieldSlices[activeWorld].archetypeTitle}
                  </strong>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {data.fieldSlices[activeWorld].ratedCount} picks
                </span>
              </div>
            )}

            <AxisRuler
              axes={displayedAxes}
              coverage={activeWorld === "global" ? data.axisCoverage : undefined}
              colorA={aura[0]}
            />
          </div>

          {/* Right: Gut Notes + Pinned North-Star Work */}
          <div className="lg:col-span-5 space-y-6">
            {Object.keys(data.critiqueCounts).length > 0 && (
              <div className="slide-housing p-6 space-y-3.5">
                <h3 className="font-display font-bold text-xl">What you notice first</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.critiqueCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tagId, count]) => {
                      const def = CRITIQUE_TAGS.find((t) => t.id === tagId);
                      return (
                        <span
                          key={tagId}
                          className={cn(
                            "px-3.5 py-1.5 rounded-full text-xs font-semibold",
                            def?.polarity === "negative"
                              ? "bg-rose-500/15 text-rose-400"
                              : "bg-secondary text-foreground",
                          )}
                        >
                          {def?.label ?? tagId} · {count}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {record.anchors.length > 0 && (
              <div className="slide-housing p-6 space-y-3.5">
                <div className="text-xs font-semibold text-primary">Pinned Inspiration</div>
                {record.anchors[0].imageUrl && (
                  <img
                    src={record.anchors[0].imageUrl}
                    alt={record.anchors[0].title}
                    className="w-full h-44 object-cover rounded-2xl"
                  />
                )}
                <h3 className="font-display font-bold text-xl leading-snug">
                  {record.anchors[0].title}
                </h3>
                {record.anchors[0].note && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    &ldquo;{record.anchors[0].note}&rdquo;
                  </p>
                )}
                <a
                  href={record.anchors[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary"
                >
                  <span>Open reference</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================================
            OBSESSED STACK vs HARD PASSES
            ================================================================== */}
        <section className="space-y-4">
          <h2 className="font-display font-bold text-2xl sm:text-3xl">
            Obsessions &amp; Hard Passes
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topPlates.slice(0, 3).map((tp) => {
              const p = platesById.get(tp.plateId);
              if (!p) return null;
              return (
                <motion.div
                  key={tp.plateId}
                  whileHover={{ y: -3 }}
                  className="slide-housing p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                      Obsessed
                    </span>
                    <span className="text-muted-foreground">{fieldLabels.get(p.fieldId)}</span>
                  </div>
                  <PlateSpecimen plate={p} compact interactiveTilt />
                  <div>
                    <div className="font-display font-bold text-lg">{p.label}</div>
                    <p className="text-xs text-muted-foreground">{p.canonicalRef}</p>
                  </div>
                </motion.div>
              );
            })}

            {data.negativeAnchors.slice(0, 3).map((na) => {
              const p = platesById.get(na.plateId);
              if (!p) return null;
              return (
                <motion.div
                  key={na.plateId}
                  whileHover={{ y: -3 }}
                  className="slide-housing p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-semibold">
                      Hard Pass
                    </span>
                    <span className="text-muted-foreground">Dealbreaker</span>
                  </div>
                  <PlateSpecimen plate={p} compact interactiveTilt />
                  <div>
                    <div className="font-display font-bold text-lg">{p.label}</div>
                    <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
