import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Sliders, Layers } from "lucide-react";
import { Header } from "@/components/Header";
import { PlateSpecimen } from "@/components/PlateSpecimen";
import {
  STUDIO_CATALOG,
  computeStudioBlend,
  getActiveHandle,
  listPublicDesigners,
} from "@/lib/backend-provider";
import { cn } from "@/lib/utils";

const FAN_WORLD_IDS = [
  { fieldId: "architecture", plateId: "pl_arch_ando", short: "Architecture" },
  { fieldId: "fashion", plateId: "pl_fash_avant", short: "Fashion" },
  { fieldId: "photography", plateId: "pl_photo_wkw", short: "Photography" },
  { fieldId: "industrial", plateId: "pl_ms_tactile_instrument", short: "Objects" },
  { fieldId: "ui-ux", plateId: "pl_ui_dark_editorial", short: "Apps & UI" },
  { fieldId: "graphic", plateId: "pl_gd_swiss_intl", short: "Print" },
  { fieldId: "motion-spatial", plateId: "pl_ms_generative_graphic", short: "3D & Motion" },
];

const SAMPLE_BLENDS = [
  { a: "alba", b: "kenji" },
  { a: "marlow", b: "sora" },
  { a: "mateo", b: "alba" },
];

export default function HomePage() {
  const activeHandle = getActiveHandle();
  const [focusedFanIdx, setFocusedFanIdx] = useState<number>(3);
  const [tunerIdx, setTunerIdx] = useState<number>(1);
  const [pairIdx, setPairIdx] = useState<number>(0);
  const [stackSlide, setStackSlide] = useState<number>(0);

  const designers = useMemo(() => listPublicDesigners(), []);
  const platesById = useMemo(
    () => new Map(STUDIO_CATALOG.plates.map((p) => [p.id, p])),
    [],
  );

  const fanCards = useMemo(
    () =>
      FAN_WORLD_IDS.map((item) => ({
        ...item,
        plate: platesById.get(item.plateId)!,
        field: STUDIO_CATALOG.fields.find((f) => f.id === item.fieldId)!,
      })).filter((x) => Boolean(x.plate && x.field)),
    [platesById],
  );

  const tunerPlates = useMemo(
    () =>
      [
        "pl_craft_density_telemetry",
        "pl_craft_density_operator",
        "pl_craft_density_balanced",
        "pl_craft_density_gallery",
      ]
        .map((id) => platesById.get(id)!)
        .filter(Boolean),
    [platesById],
  );

  const activePair = SAMPLE_BLENDS[pairIdx];
  const sampleBlend = useMemo(
    () => computeStudioBlend(activePair.a, activePair.b),
    [activePair.a, activePair.b],
  );

  const focusedCard = fanCards[focusedFanIdx] ?? fanCards[0];
  const glowColor = focusedCard?.plate.palette[2] ?? "#FF5A36";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ==================================================================
            HERO: SPLAYED PHYSICAL 7-WORLD FAN DECK + AMBIENT LIGHT-TABLE GLOW
            ================================================================== */}
        <section className="relative pt-10 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
          {/* Dynamic ambient light-table glow shifting smoothly with focused slide */}
          <motion.div
            animate={{ backgroundColor: glowColor }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 w-[520px] h-[300px] rounded-full blur-[130px] opacity-22"
          />

          <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
            <h1
              className="font-display font-extrabold text-[2.65rem] sm:text-6xl lg:text-[4.6rem] leading-[0.96] tracking-[-0.03em] max-w-3xl"
              data-testid="text-hero-headline"
            >
              Find out how your eye works. Blend taste with any creative.
            </h1>

            <p
              className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
              data-testid="text-hero-sub"
            >
              Play through architecture, fashion, film, hardware, print, and apps. Save your
              permanent Taste Card, send a link to a friend, and watch your two worlds merge.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/capture"
                className="tactile-pill rounded-full px-7 h-13 bg-primary text-primary-foreground font-display font-bold text-base inline-flex items-center gap-2.5"
                data-testid="button-start-quiz"
              >
                <span>{activeHandle ? "Add more to my taste" : "Play the 2-min Taste Deck"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/blend/alba/kenji"
                className="spring-tap text-sm font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 px-2 py-2"
                data-testid="button-view-demo-blend"
              >
                Open a live 5-card Blend story
              </Link>
            </div>

            {/* Interactive Splayed Fan Hand (Scrolltide: Fan Deck) */}
            <div className="mt-12 sm:mt-16 w-full max-w-4xl">
              <div className="relative h-[250px] sm:h-[310px] flex items-center justify-center">
                {fanCards.map((item, idx) => {
                  const offset = idx - 3; // -3 .. +3
                  const isFocused = idx === focusedFanIdx;
                  const baseAngle = offset * 6.5;
                  const baseX = offset * (typeof window !== "undefined" && window.innerWidth < 640 ? 34 : 74);
                  const baseY = Math.abs(offset) * 10;

                  return (
                    <motion.button
                      key={item.fieldId}
                      type="button"
                      onMouseEnter={() => setFocusedFanIdx(idx)}
                      onFocus={() => setFocusedFanIdx(idx)}
                      onClick={() => setFocusedFanIdx(idx)}
                      animate={{
                        x: baseX,
                        y: isFocused ? baseY - 28 : baseY,
                        rotate: isFocused ? 0 : baseAngle,
                        scale: isFocused ? 1.09 : 0.94,
                      }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      style={{ zIndex: isFocused ? 30 : 10 + (4 - Math.abs(offset)) }}
                      className={cn(
                        "slide-housing absolute w-44 sm:w-56 p-2.5 text-left cursor-pointer",
                        isFocused && "ring-2 ring-primary/80",
                      )}
                    >
                      <PlateSpecimen plate={item.plate} compact />
                      <div className="pt-2 px-1 flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-xs sm:text-sm truncate">
                          {item.short}
                        </span>
                        <span
                          style={{ backgroundColor: item.plate.palette[2] }}
                          className="h-2 w-2 rounded-full shrink-0"
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Active World Pill Strip below the splayed hand */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                {fanCards.map((item, idx) => (
                  <button
                    key={item.fieldId}
                    type="button"
                    onClick={() => setFocusedFanIdx(idx)}
                    className={cn(
                      "spring-tap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                      focusedFanIdx === idx
                        ? "bg-foreground text-background"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.short}
                  </button>
                ))}
              </div>
              {focusedCard && (
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground">{focusedCard.field.label}:</strong>{" "}
                  {focusedCard.field.coverHint}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================================
            INTERACTIVE EXPERIENCE SHOWCASE: SPOTIFY-BLEND MULTI-CARD STACK + FM TUNER
            ================================================================== */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid lg:grid-cols-12 gap-10 items-center">
          {/* Left: Interactive Stacked Blend Cards you physically flick through */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-bold text-2xl sm:text-3xl">
                Every pair gets their own Blend deck.
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Send your link to an architect, photographer, fashion friend, or co-founder. You
              don&apos;t just get a flat number: you get swipeable story cards showing where your
              eyes lock in, where you fight, and what to steal from each other&apos;s desk.
            </p>

            {/* Pair selector pills */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_BLENDS.map((p, idx) => (
                <button
                  key={`${p.a}-${p.b}`}
                  type="button"
                  onClick={() => {
                    setPairIdx(idx);
                    setStackSlide(0);
                  }}
                  className={cn(
                    "spring-tap px-3.5 py-1.5 rounded-full text-xs font-semibold",
                    pairIdx === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  @{p.a} + @{p.b}
                </button>
              ))}
            </div>

            {/* Interactive 3-Card Photo Stack (click card to deal next card to front!) */}
            {sampleBlend && (() => {
              const auraA =
                sampleBlend.designerA.versions[sampleBlend.designerA.versions.length - 1].data
                  .auraColors ?? ["#FF5A36", "#F59E0B", "#FB7185"];
              const auraB =
                sampleBlend.designerB.versions[sampleBlend.designerB.versions.length - 1].data
                  .auraColors ?? ["#38BDF8", "#818CF8", "#2DD4BF"];

              const sharedPlate = sampleBlend.blend.sharedPlates[0]
                ? platesById.get(sampleBlend.blend.sharedPlates[0].plateId)
                : null;
              const clashPlate = sampleBlend.blend.divergentPlates[0]
                ? platesById.get(sampleBlend.blend.divergentPlates[0].plateId)
                : null;

              return (
                <div className="relative pt-2">
                  <div
                    onClick={() => setStackSlide((s) => (s + 1) % 3)}
                    className="relative cursor-pointer select-none"
                  >
                    {/* Back stacked card silhouette */}
                    <div className="slide-housing absolute inset-0 translate-x-3 translate-y-3 rotate-2 opacity-45 pointer-events-none" />

                    <AnimatePresence mode="wait">
                      {stackSlide === 0 && (
                        <motion.div
                          key="card-aura"
                          initial={{ opacity: 0, x: 26, rotate: 2 }}
                          animate={{ opacity: 1, x: 0, rotate: 0 }}
                          exit={{ opacity: 0, x: -34, rotate: -3 }}
                          transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
                          className="slide-housing relative p-6 sm:p-7 overflow-hidden min-h-[290px] flex flex-col justify-between"
                        >
                          {/* Dual Merging Aura Orbs */}
                          <div className="relative h-24 flex items-center justify-center">
                            <motion.div
                              animate={{ x: [-18, -8, -18] }}
                              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                              style={{ backgroundColor: auraA[0] }}
                              className="w-24 h-24 rounded-full blur-xl opacity-75"
                            />
                            <motion.div
                              animate={{ x: [18, 8, 18] }}
                              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                              style={{ backgroundColor: auraB[0] }}
                              className="w-24 h-24 rounded-full blur-xl opacity-75 -ml-8"
                            />
                            <div className="absolute font-display font-extrabold text-5xl sm:text-6xl tabular-nums drop-shadow">
                              {sampleBlend.blend.score}%
                            </div>
                          </div>

                          <div className="space-y-1.5 text-center">
                            <div className="text-xs font-semibold text-primary">
                              {sampleBlend.blend.dyad.title}
                            </div>
                            <div className="font-display font-bold text-xl">
                              {sampleBlend.designerA.displayName} ×{" "}
                              {sampleBlend.designerB.displayName}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {sampleBlend.blend.dyad.summary}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
                            <span>Card 1 of 3 · Merging Aura</span>
                            <span className="text-foreground font-semibold">Tap card to flip →</span>
                          </div>
                        </motion.div>
                      )}

                      {stackSlide === 1 && (
                        <motion.div
                          key="card-shared"
                          initial={{ opacity: 0, x: 26, rotate: 2 }}
                          animate={{ opacity: 1, x: 0, rotate: 0 }}
                          exit={{ opacity: 0, x: -34, rotate: -3 }}
                          transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
                          className="slide-housing relative p-6 sm:p-7 min-h-[290px] flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" /> Both Obsessed
                            </span>
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                              Harmony {sampleBlend.blend.harmonyScore}%
                            </span>
                          </div>

                          {sharedPlate ? (
                            <div className="grid sm:grid-cols-2 gap-4 items-center my-auto">
                              <PlateSpecimen plate={sharedPlate} compact />
                              <div className="space-y-1">
                                <div className="font-display font-bold text-lg leading-snug">
                                  {sharedPlate.label}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {sharedPlate.subtitle}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground my-auto">
                              Two distinct worlds meeting for the first time.
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                            <span>Card 2 of 3 · Shared Obsession</span>
                            <span className="text-foreground font-semibold">Tap card to flip →</span>
                          </div>
                        </motion.div>
                      )}

                      {stackSlide === 2 && (
                        <motion.div
                          key="card-clash"
                          initial={{ opacity: 0, x: 26, rotate: 2 }}
                          animate={{ opacity: 1, x: 0, rotate: 0 }}
                          exit={{ opacity: 0, x: -34, rotate: -3 }}
                          transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
                          className="slide-housing relative p-6 sm:p-7 min-h-[290px] flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5" /> Creative Friction
                            </span>
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">
                              Tension {sampleBlend.blend.frictionScore}%
                            </span>
                          </div>

                          {clashPlate ? (
                            <div className="grid sm:grid-cols-2 gap-4 items-center my-auto">
                              <PlateSpecimen plate={clashPlate} compact />
                              <div className="space-y-1">
                                <div className="font-display font-bold text-lg leading-snug">
                                  {clashPlate.label}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  One of them defends this to the death; the other walked right past.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="my-auto space-y-1">
                              <div className="font-display font-bold text-lg">
                                High craft alignment, zero ugly clashes.
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Both rejected the exact same AI-slop traps independently.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                            <span>Card 3 of 3 · Friendly Fight</span>
                            <span className="text-foreground font-semibold">Tap card to loop →</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right: Live Skeuomorphic FM Tuner Interactive Piece (Scrolltide: Tuner) */}
          <div className="lg:col-span-6 slide-housing p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sliders className="h-4 w-4" />
                <span>No boring forms — tune it live</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                CH 0{tunerIdx + 1} / 04
              </span>
            </div>

            <h3 className="font-display font-bold text-2xl leading-tight">
              Turn the dial: how much breathing room does your eye crave?
            </h3>

            {tunerPlates[tunerIdx] && (
              <PlateSpecimen
                plate={tunerPlates[tunerIdx]}
                interactiveTilt
                className="aspect-auto h-52 w-full"
              />
            )}

            {/* Skeuomorphic FM Tick-Tape Dial */}
            <div className="tuner-well rounded-2xl p-3 space-y-2.5">
              <div className="relative h-8 flex items-center justify-between px-4">
                {Array.from({ length: 29 }).map((_, idx) => {
                  const major = idx % 9 === 0;
                  return (
                    <span
                      key={idx}
                      className={cn(
                        "w-0.5 rounded-full transition-colors",
                        major ? "h-5 bg-foreground/65" : "h-2.5 bg-foreground/20",
                      )}
                    />
                  );
                })}
                {/* Glowing Vermilion FM Needle */}
                <motion.div
                  animate={{ left: `${12 + tunerIdx * 25.3}%` }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="pointer-events-none absolute top-0.5 bottom-0.5 w-1 rounded-full bg-primary shadow-[0_0_12px_#FF5A36]"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {["4px Tight", "8px Crisp", "16px Open", "32px Calm"].map((lbl, idx) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setTunerIdx(idx)}
                    className={cn(
                      "spring-tap py-2 rounded-xl text-xs font-semibold transition-colors",
                      tunerIdx === idx
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            CREATIVE COMMUNITY STRIP: BLEND WITH PRACTITIONERS ACROSS ALL WORLDS
            ================================================================== */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl">
                Jump into a Blend right now
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Compare across architects, fashion directors, industrial designers, and filmmakers.
              </p>
            </div>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Explore all 68 slides across 8 worlds →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {designers.map((d) => {
              const latest = d.versions[d.versions.length - 1];
              const aura = latest.data.auraColors ?? ["#FF5A36", "#F59E0B", "#FB7185"];
              const topPlate = latest.data.topPlates[0]
                ? platesById.get(latest.data.topPlates[0].plateId)
                : null;

              return (
                <div
                  key={d.username}
                  className="slide-housing p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    {topPlate && <PlateSpecimen plate={topPlate} compact />}
                    <div className="flex items-center gap-2">
                      <span
                        style={{ background: `linear-gradient(135deg, ${aura[0]}, ${aura[1]})` }}
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                      />
                      <span className="font-display font-bold text-sm truncate">
                        {d.displayName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {d.disciplineLine} · {d.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs font-semibold">
                    <Link
                      href={`/profile/${d.username}`}
                      className="spring-tap py-1.5 rounded-full bg-secondary text-center hover:bg-accent"
                    >
                      Taste
                    </Link>
                    <Link
                      href={
                        activeHandle && activeHandle !== d.username
                          ? `/blend/${activeHandle}/${d.username}`
                          : `/blend/${d.username}/${d.username === "alba" ? "kenji" : "alba"}`
                      }
                      className="spring-tap py-1.5 rounded-full bg-foreground text-background text-center"
                    >
                      Blend
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
