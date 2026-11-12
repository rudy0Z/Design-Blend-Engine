import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";
import { CRITIQUE_TAGS } from "@workspace/taste-engine";
import { Header } from "@/components/Header";
import { AxisRuler } from "@/components/AxisRuler";
import { PlateSpecimen } from "@/components/PlateSpecimen";
import {
  STUDIO_CATALOG,
  computeStudioBlend,
  listPublicDesigners,
} from "@/lib/backend-provider";
import { cn } from "@/lib/utils";

const STORY_TITLES = [
  "The Merge",
  "Same Eye",
  "Friendly Fight",
  "Across Worlds",
  "Steal This",
];

export default function BlendPage() {
  const { userA = "alba", userB = "kenji" } = useParams<{ userA: string; userB: string }>();
  const [, setLocation] = useLocation();
  const [cardIdx, setCardIdx] = useState(0);
  const [mode, setMode] = useState<"deck" | "deep">("deck");
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSelf = userA.toLowerCase() === userB.toLowerCase();
  const result = useMemo(
    () => (isSelf ? null : computeStudioBlend(userA, userB)),
    [userA, userB, isSelf],
  );
  const allDesigners = useMemo(() => listPublicDesigners(), []);
  const platesById = useMemo(
    () => new Map(STUDIO_CATALOG.plates.map((p) => [p.id, p])),
    [],
  );
  const fieldLabels = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of STUDIO_CATALOG.fields) m.set(f.id, f.label);
    return m;
  }, []);

  async function exportActiveStoryCard() {
    const el = document.getElementById("active-blend-story-card");
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      const a = document.createElement("a");
      a.download = `blend-${userA}-x-${userB}-card-${cardIdx + 1}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setExporting(false);
    }
  }

  function copyShareLink() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  }

  if (isSelf || !result) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            Pick two different creatives to see their Blend story.
          </h1>
          <Link
            href="/blend/alba/kenji"
            className="tactile-pill px-7 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center"
          >
            Open Alba × Kenji Blend
          </Link>
        </main>
      </div>
    );
  }

  const { designerA, designerB, blend } = result;
  const verAData = designerA.versions[designerA.versions.length - 1].data;
  const verBData = designerB.versions[designerB.versions.length - 1].data;
  const auraA = verAData.auraColors ?? ["#FF5A36", "#F59E0B", "#FB7185"];
  const auraB = verBData.auraColors ?? ["#38BDF8", "#818CF8", "#2DD4BF"];
  const formatTag = (id: string) => CRITIQUE_TAGS.find((t) => t.id === id)?.label ?? id;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Living Dual-Aura Ambient Background blending Person A + Person B */}
      <div
        style={{
          background: `radial-gradient(520px circle at 28% 25%, ${auraA[0]}35, transparent 70%), radial-gradient(520px circle at 72% 35%, ${auraB[0]}35, transparent 70%)`,
        }}
        className="pointer-events-none fixed inset-0 -z-10 blur-3xl"
      />

      <Header />

      {/* Pair Switcher & Story / Deep-Dive Pill Bar */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="liquid-dock rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold">
          <span style={{ backgroundColor: auraA[0] }} className="h-3 w-3 rounded-full" />
          <select
            aria-label="First creative"
            value={designerA.username}
            onChange={(e) => {
              const nextA = e.target.value;
              const nextB =
                nextA === designerB.username
                  ? allDesigners.find((d) => d.username !== nextA)?.username ?? "kenji"
                  : designerB.username;
              setCardIdx(0);
              setLocation(`/blend/${nextA}/${nextB}`);
            }}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            {allDesigners.map((d) => (
              <option key={d.username} value={d.username} className="bg-card text-foreground">
                {d.displayName} (@{d.username})
              </option>
            ))}
          </select>

          <span className="text-muted-foreground">×</span>

          <span style={{ backgroundColor: auraB[0] }} className="h-3 w-3 rounded-full" />
          <select
            aria-label="Second creative"
            value={designerB.username}
            onChange={(e) => {
              setCardIdx(0);
              setLocation(`/blend/${designerA.username}/${e.target.value}`);
            }}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            {allDesigners
              .filter((d) => d.username !== designerA.username)
              .map((d) => (
                <option key={d.username} value={d.username} className="bg-card text-foreground">
                  {d.displayName} (@{d.username})
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="liquid-dock rounded-full p-1 flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("deck")}
              data-testid="button-story-mode"
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-colors",
                mode === "deck" ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              5-Card Blend Story
            </button>
            <button
              type="button"
              onClick={() => setMode("deep")}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-colors",
                mode === "deep" ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              Full Map
            </button>
          </div>

          <button
            type="button"
            onClick={copyShareLink}
            className="liquid-dock spring-tap rounded-full px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          MODE 1: SPOTIFY-BLEND 5-CARD INTERACTIVE STORY EXPERIENCE
          ==================================================================== */}
      {mode === "deck" && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col items-center justify-center gap-5">
          {/* 5 Story Segment Pills */}
          <div className="w-full max-w-[400px] space-y-2">
            <div className="grid grid-cols-5 gap-1.5">
              {STORY_TITLES.map((title, idx) => (
                <button
                  key={title}
                  type="button"
                  aria-label={`Story card ${idx + 1}: ${title}`}
                  onClick={() => setCardIdx(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === cardIdx
                      ? "bg-foreground scale-y-125"
                      : idx < cardIdx
                        ? "bg-primary/80"
                        : "bg-foreground/20",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
              <span>
                0{cardIdx + 1} · <strong className="text-foreground">{STORY_TITLES[cardIdx]}</strong>
              </span>
              <span>
                @{designerA.username} × @{designerB.username}
              </span>
            </div>
          </div>

          {/* Center 9:16 Tactile Blend Card Stage with Prev/Next Paddles */}
          <div className="flex items-center justify-center gap-4 w-full">
            <button
              type="button"
              aria-label="Previous card"
              disabled={cardIdx === 0}
              onClick={() => setCardIdx((c) => Math.max(0, c - 1))}
              className="hidden sm:flex liquid-dock spring-tap h-11 w-11 rounded-full items-center justify-center disabled:opacity-25"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="w-full max-w-[390px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${designerA.username}-${designerB.username}-${cardIdx}`}
                  id="active-blend-story-card"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.45}
                  onDragEnd={(_, info) => {
                    if ((info.offset.x < -60 || info.velocity.x < -350) && cardIdx < 4) {
                      setCardIdx((c) => c + 1);
                    } else if ((info.offset.x > 60 || info.velocity.x > 350) && cardIdx > 0) {
                      setCardIdx((c) => c - 1);
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.95, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
                  style={{ minHeight: 590 }}
                  className="slide-housing relative p-6 sm:p-7 flex flex-col justify-between overflow-hidden select-none cursor-grab active:cursor-grabbing"
                >
                  {/* CARD 01: MERGING DUAL AURA & SCORE */}
                  {cardIdx === 0 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Design Blend</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          01 / 05
                        </span>
                      </div>

                      <div className="relative h-56 flex items-center justify-center my-2">
                        <motion.div
                          animate={{
                            x: [-28, -10, -28],
                            y: [-10, 8, -10],
                            scale: [1, 1.08, 1],
                          }}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                          style={{ backgroundColor: auraA[0] }}
                          className="w-36 h-36 rounded-full blur-2xl opacity-80"
                        />
                        <motion.div
                          animate={{
                            x: [28, 10, 28],
                            y: [10, -8, 10],
                            scale: [1.06, 0.96, 1.06],
                          }}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                          style={{ backgroundColor: auraB[0] }}
                          className="w-36 h-36 rounded-full blur-2xl opacity-80 -ml-14"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <div className="font-display font-extrabold text-7xl tracking-tight tabular-nums drop-shadow-md">
                            {blend.score}%
                          </div>
                          <span className="text-xs font-semibold tracking-wide opacity-90 mt-1">
                            Taste Match
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 text-center">
                        <div className="inline-block px-3.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">
                          {blend.dyad.title}
                        </div>
                        <h2 className="font-display font-extrabold text-2xl leading-tight">
                          {designerA.displayName} &amp; {designerB.displayName}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {blend.dyad.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-border/60 text-xs">
                        <div className="rounded-2xl bg-secondary/70 p-3">
                          <div className="text-muted-foreground text-[11px]">Shared Eye</div>
                          <div className="font-display font-bold text-lg tabular-nums mt-0.5">
                            {blend.harmonyScore}%
                          </div>
                        </div>
                        <div className="rounded-2xl bg-secondary/70 p-3">
                          <div className="text-muted-foreground text-[11px]">Creative Spark</div>
                          <div className="font-display font-bold text-lg text-primary tabular-nums mt-0.5">
                            {blend.frictionScore}%
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CARD 02: SHARED OBSESSIONS ("SAME EYE") */}
                  {cardIdx === 1 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Mutual Obsessions
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">02 / 05</span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        <h2 className="font-display font-extrabold text-2xl leading-tight">
                          Work you&apos;d both fight for in a room.
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Independently rated high by both @{designerA.username} and @
                          {designerB.username}.
                        </p>
                      </div>

                      <div className="my-auto py-3 space-y-3">
                        {blend.sharedPlates.length === 0 ? (
                          <div className="rounded-2xl bg-secondary/60 p-5 text-center text-xs text-muted-foreground">
                            You explored completely different creative worlds so far — play a shared
                            world to uncover mutual favorites!
                          </div>
                        ) : (
                          blend.sharedPlates.slice(0, 2).map((sp) => {
                            const p = platesById.get(sp.plateId);
                            if (!p) return null;
                            return (
                              <div
                                key={sp.plateId}
                                className="rounded-2xl bg-secondary/55 p-3 space-y-2"
                              >
                                <PlateSpecimen plate={p} compact className="aspect-auto h-36 w-full" />
                                <div className="flex items-baseline justify-between gap-2 px-1">
                                  <div className="font-display font-bold text-sm truncate">
                                    {p.label}
                                  </div>
                                  <span className="font-mono text-[11px] text-emerald-400 shrink-0 tabular-nums">
                                    {sp.valueA} · {sp.valueB}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="text-center text-xs text-muted-foreground">
                        Swipe left for where your eyes clash →
                      </div>
                    </>
                  )}

                  {/* CARD 03: THE FRIENDLY FIGHT / DEALBREAKER CLASH */}
                  {cardIdx === 2 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5" /> The Friendly Fight
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">03 / 05</span>
                      </div>

                      {blend.divergentPlates[0] &&
                      platesById.get(blend.divergentPlates[0].plateId) ? (
                        (() => {
                          const dp = blend.divergentPlates[0];
                          const p = platesById.get(dp.plateId)!;
                          const aLoved = dp.valueA > dp.valueB;
                          return (
                            <>
                              <div className="space-y-1 mt-2">
                                <h2 className="font-display font-extrabold text-2xl leading-tight">
                                  Don&apos;t put both of you in charge of this one.
                                </h2>
                                {blend.penaltyApplied > 0 && (
                                  <p className="text-xs text-rose-400 font-medium">
                                    Dealbreaker clash knocked -{blend.penaltyApplied}% off your match!
                                  </p>
                                )}
                              </div>

                              <div className="my-auto py-3 space-y-3">
                                <PlateSpecimen plate={p} compact className="aspect-auto h-44 w-full" />
                                <div>
                                  <div className="font-display font-bold text-lg">{p.label}</div>
                                  <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                                  <div className="rounded-2xl bg-secondary/70 p-3">
                                    <div className="font-semibold">@{designerA.username}</div>
                                    <div
                                      className={cn(
                                        "font-display font-bold text-base mt-0.5 tabular-nums",
                                        aLoved ? "text-emerald-400" : "text-rose-400",
                                      )}
                                    >
                                      {aLoved ? `Loved (${dp.valueA})` : `Passed (${dp.valueA})`}
                                    </div>
                                    {dp.tagsA && dp.tagsA[0] && (
                                      <div className="text-[11px] text-muted-foreground mt-0.5">
                                        &ldquo;{formatTag(dp.tagsA[0])}&rdquo;
                                      </div>
                                    )}
                                  </div>

                                  <div className="rounded-2xl bg-secondary/70 p-3">
                                    <div className="font-semibold">@{designerB.username}</div>
                                    <div
                                      className={cn(
                                        "font-display font-bold text-base mt-0.5 tabular-nums",
                                        !aLoved ? "text-emerald-400" : "text-rose-400",
                                      )}
                                    >
                                      {!aLoved ? `Loved (${dp.valueB})` : `Passed (${dp.valueB})`}
                                    </div>
                                    {dp.tagsB && dp.tagsB[0] && (
                                      <div className="text-[11px] text-muted-foreground mt-0.5">
                                        &ldquo;{formatTag(dp.tagsB[0])}&rdquo;
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div className="my-auto text-center space-y-2">
                          <h2 className="font-display font-extrabold text-2xl">
                            Zero dealbreaker fights.
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            You both rejected the exact same AI-slop traps without hesitation.
                          </p>
                        </div>
                      )}

                      <div className="text-center text-xs text-muted-foreground">
                        Swipe left for world-by-world chemistry →
                      </div>
                    </>
                  )}

                  {/* CARD 04: WORLD-BY-WORLD CHEMISTRY */}
                  {cardIdx === 3 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" /> World Chemistry
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">04 / 05</span>
                      </div>

                      <div className="space-y-1 mt-2">
                        <h2 className="font-display font-extrabold text-2xl leading-tight">
                          Where you align by creative field.
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          You don&apos;t have to agree in every discipline to build great work together.
                        </p>
                      </div>

                      <div className="my-auto py-4 space-y-3.5">
                        {blend.perField.map((pf) => (
                          <div key={pf.fieldId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span>{fieldLabels.get(pf.fieldId) ?? pf.fieldId}</span>
                              <span className="font-mono tabular-nums">{pf.score}%</span>
                            </div>
                            <div className="tuner-well h-3 rounded-full overflow-hidden p-0.5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pf.score}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                style={{
                                  background: `linear-gradient(90deg, ${auraA[0]}, ${auraB[0]})`,
                                }}
                                className="h-full rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-center text-xs text-muted-foreground">
                        Swipe left for references to trade →
                      </div>
                    </>
                  )}

                  {/* CARD 05: CROSSOVER DISCOVERY ("STEAL THIS") */}
                  {cardIdx === 4 && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Trade References
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">05 / 05</span>
                      </div>

                      <div className="space-y-1 mt-2">
                        <h2 className="font-display font-extrabold text-2xl leading-tight">
                          Steal this from their light-table.
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Unseen by one of you, loved by the other — and a natural match for your eye.
                        </p>
                      </div>

                      <div className="my-auto py-3 space-y-3">
                        {blend.crossoverBridges.slice(0, 2).map((cb) => {
                          const p = platesById.get(cb.plateId);
                          if (!p) return null;
                          const giver =
                            cb.fromUser === "A" ? designerA.displayName : designerB.displayName;
                          const receiver =
                            cb.fromUser === "A" ? designerB.displayName : designerA.displayName;
                          return (
                            <div
                              key={cb.plateId}
                              className="rounded-2xl bg-secondary/60 p-3 space-y-2"
                            >
                              <div className="text-[11px] font-semibold text-primary">
                                From {giver} → for {receiver} ({cb.predictedFitForOther}% fit)
                              </div>
                              <PlateSpecimen plate={p} compact className="aspect-auto h-32 w-full" />
                              <div className="font-display font-bold text-sm">{p.label}</div>
                            </div>
                          );
                        })}
                      </div>

                      <Link
                        href="/capture"
                        className="tactile-pill h-11 w-full rounded-full bg-foreground text-background font-display font-bold text-xs inline-flex items-center justify-center"
                      >
                        Mint your own Taste Card to Blend →
                      </Link>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              type="button"
              aria-label="Next card"
              disabled={cardIdx === 4}
              onClick={() => setCardIdx((c) => Math.min(4, c + 1))}
              className="hidden sm:flex liquid-dock spring-tap h-11 w-11 rounded-full items-center justify-center disabled:opacity-25"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Card Controls below */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCardIdx((c) => (c + 1) % 5)}
              className="spring-tap px-5 h-10 rounded-full bg-secondary text-xs font-semibold"
            >
              Next Card ({cardIdx + 1}/5) →
            </button>
            <button
              type="button"
              onClick={exportActiveStoryCard}
              disabled={exporting}
              className="tactile-pill px-5 h-10 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? "Saving PNG..." : "Save This Card (PNG)"}</span>
            </button>
          </div>
        </main>
      )}

      {/* ====================================================================
          MODE 2: FULL WIDE MAP (ALL DUAL-BEAD FADERS & PLATES AT ONCE)
          ==================================================================== */}
      {mode === "deep" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
          <section className="slide-housing p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
                  {designerA.displayName} × {designerB.displayName} — {blend.score}%
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{blend.dyad.summary}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span style={{ backgroundColor: auraA[0] }} className="h-3 w-3 rounded-full" /> @
                  {designerA.username}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span style={{ backgroundColor: auraB[0] }} className="h-3 w-3 rounded-full" /> @
                  {designerB.username}
                </span>
              </div>
            </div>

            <AxisRuler
              axes={verAData.axes}
              compareAxes={verBData.axes}
              colorA={auraA[0]}
              colorB={auraB[0]}
              labelA={designerA.username}
              labelB={designerB.username}
            />
          </section>

          {blend.sharedPlates.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display font-bold text-2xl">Shared Obsessions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {blend.sharedPlates.map((sp) => {
                  const p = platesById.get(sp.plateId);
                  if (!p) return null;
                  return (
                    <div key={sp.plateId} className="slide-housing p-4 space-y-2.5">
                      <PlateSpecimen plate={p} compact interactiveTilt />
                      <div className="font-display font-bold text-base">{p.label}</div>
                      <div className="text-xs text-muted-foreground">
                        @{designerA.username}: {sp.valueA} · @{designerB.username}: {sp.valueB}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
