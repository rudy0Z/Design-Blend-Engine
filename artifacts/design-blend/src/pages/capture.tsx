import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Scissors,
  Search,
  Upload,
} from "lucide-react";
import {
  CRITIQUE_TAGS,
  buildAdaptiveQueue,
  computeProfileVersion,
  type CapturePrompt,
  type Signal,
} from "@workspace/taste-engine";
import { Header } from "@/components/Header";
import { PlateSpecimen } from "@/components/PlateSpecimen";
import {
  STUDIO_CATALOG,
  getActiveAccount,
  getActiveHandle,
  getArchetypeDetails,
  getDesignerProfile,
  saveCompletedCapture,
  uploadUserReferenceImage,
} from "@/lib/backend-provider";
import { cn } from "@/lib/utils";

type Stage = "worlds" | "play" | "ceremony";

const REACTIONS = [
  { key: "1", label: "Hard pass", value: 10, pill: "bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white" },
  { key: "2", label: "Not for me", value: 38, pill: "bg-secondary text-muted-foreground hover:text-foreground" },
  { key: "3", label: "Into it", value: 74, pill: "bg-secondary text-foreground hover:bg-accent" },
  { key: "4", label: "Obsessed", value: 95, pill: "bg-foreground text-background" },
] as const;

export default function CapturePage() {
  const [, setLocation] = useLocation();
  const activeAccount = getActiveAccount();
  const existingHandle = getActiveHandle();
  const existingRecord = useMemo(
    () => (existingHandle ? getDesignerProfile(existingHandle) : null),
    [existingHandle],
  );

  const [stage, setStage] = useState<Stage>("worlds");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "architecture",
    "fashion",
    "photography",
    "ui-ux",
  ]);
  const [deckLength, setDeckLength] = useState<12 | 20>(12);

  const [promptIndex, setPromptIndex] = useState(0);
  const [sessionSignals, setSessionSignals] = useState<Signal[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [tunerIdx, setTunerIdx] = useState<number>(1);
  const [loupeActive, setLoupeActive] = useState(false);

  // Ceremony tear-off stub state (FocusFlight / Run Receipt spell — zero spoilers until torn!)
  const [stubTorn, setStubTorn] = useState(false);

  // Account & Permanent Save fields
  const [handle, setHandle] = useState(existingRecord?.username ?? activeAccount?.username ?? "");
  const [displayName, setDisplayName] = useState(
    existingRecord?.displayName ?? activeAccount?.displayName ?? "",
  );
  const [disciplineLine, setDisciplineLine] = useState(
    existingRecord?.disciplineLine ?? "Creative Director & Designer",
  );
  const [email, setEmail] = useState(activeAccount?.email ?? "");
  const [password, setPassword] = useState("");
  const [refTitle, setRefTitle] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refUploadedImg, setRefUploadedImg] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);

  // Motion values for physical drag/throw stack
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-180, 0, 180], [-10, 0, 10]);
  const loveGlow = useTransform(dragX, [20, 140], [0, 1]);
  const passGlow = useTransform(dragX, [-140, -20], [1, 0]);

  const platesById = useMemo(
    () => new Map(STUDIO_CATALOG.plates.map((p) => [p.id, p])),
    [],
  );

  const queue: CapturePrompt[] = useMemo(() => {
    if (stage === "worlds") return [];
    return buildAdaptiveQueue(STUDIO_CATALOG.plates, {
      fieldIds: selectedFields,
      existingSignals: existingRecord?.signals ?? [],
      maxPrompts: deckLength,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, selectedFields, deckLength]);

  const currentPrompt = queue[promptIndex] ?? null;

  // Computed ONLY for the end Reveal Ceremony — NEVER spoiled mid-deck!
  const ceremonyResult = useMemo(() => {
    const merged = [...(existingRecord?.signals ?? []), ...sessionSignals];
    return computeProfileVersion(merged, STUDIO_CATALOG.plates);
  }, [existingRecord, sessionSignals]);

  const ceremonyArchetype = useMemo(
    () => getArchetypeDetails(ceremonyResult.archetype.id),
    [ceremonyResult.archetype.id],
  );

  function toggleWorld(id: string) {
    setSelectedFields((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id],
    );
  }

  function toggleTag(id: string) {
    setActiveTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function recordAndAdvance(entries: Omit<Signal, "sequence">[]) {
    setSessionSignals((prev) => {
      const base = prev.length + 1;
      return [...prev, ...entries.map((e, i) => ({ ...e, sequence: base + i }))];
    });
    setActiveTags([]);
    setTunerIdx(1);
    dragX.set(0);

    if (promptIndex + 1 >= queue.length) {
      setStubTorn(false);
      setStage("ceremony");
    } else {
      setPromptIndex((i) => i + 1);
    }
  }

  function skipCurrent() {
    setActiveTags([]);
    dragX.set(0);
    if (promptIndex + 1 >= queue.length) {
      setStubTorn(false);
      setStage("ceremony");
    } else {
      setPromptIndex((i) => i + 1);
    }
  }

  function undoPrevious() {
    if (promptIndex === 0) return;
    setPromptIndex((i) => Math.max(0, i - 1));
    setSessionSignals((prev) => prev.slice(0, -1));
  }

  // Instant keyboard shortcuts on desktop
  useEffect(() => {
    if (stage !== "play" || !currentPrompt) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        skipCurrent();
        return;
      }
      if (currentPrompt.kind === "critique_plate") {
        const match = REACTIONS.find((r) => r.key === e.key);
        if (match) {
          e.preventDefault();
          recordAndAdvance([
            {
              plateId: currentPrompt.plate.id,
              mode: "rate",
              value: match.value,
              critiqueTags: activeTags.length > 0 ? activeTags : undefined,
            },
          ]);
        }
      } else if (currentPrompt.kind === "foil_pair") {
        if (e.key === "1" || e.key === "ArrowLeft") {
          e.preventDefault();
          recordAndAdvance([
            { plateId: currentPrompt.plateA.id, mode: "pair", value: 90, critiqueTags: activeTags },
            { plateId: currentPrompt.plateB.id, mode: "pair", value: 24 },
          ]);
        } else if (e.key === "2" || e.key === "ArrowRight") {
          e.preventDefault();
          recordAndAdvance([
            { plateId: currentPrompt.plateB.id, mode: "pair", value: 90, critiqueTags: activeTags },
            { plateId: currentPrompt.plateA.id, mode: "pair", value: 24 },
          ]);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentPrompt, activeTags, promptIndex]);

  async function handleSaveForever(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await saveCompletedCapture({
        username: handle || displayName || "creative",
        displayName: displayName || handle || "Creative",
        disciplineLine,
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        newSignals: sessionSignals,
        newAnchor:
          refTitle.trim() || refUploadedImg
            ? {
                title: refTitle.trim() || "Personal North-Star Reference",
                creatorCredit: "Saved to Board",
                url: refUrl.trim() || window.location.origin,
                imageUrl: refUploadedImg ?? undefined,
                fieldId: selectedFields[0] ?? "architecture",
                note: "Pinned during Taste Pass reveal",
              }
            : null,
      });
      setLocation(`/profile/${saved.username}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* ====================================================================
          STEP 1: TACTILE CARTRIDGE TRAY — PICK YOUR CREATIVE WORLDS
          ==================================================================== */}
      {stage === "worlds" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
                Load your light-table.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                Tap the creative worlds you actually care about. Mix architecture with fashion, or
                film with hardware — we keep your taste in each world distinct.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedFields(
                  selectedFields.length === STUDIO_CATALOG.fields.length
                    ? ["architecture", "ui-ux"]
                    : STUDIO_CATALOG.fields.map((f) => f.id),
                )
              }
              className="spring-tap self-start sm:self-auto px-4 py-2 rounded-full bg-secondary text-xs font-semibold"
            >
              {selectedFields.length === STUDIO_CATALOG.fields.length
                ? "Select fewer"
                : "Select all 8 worlds"}
            </button>
          </div>

          {/* 8 Tactile Slide Cartridges */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {STUDIO_CATALOG.fields.map((field) => {
              const active = selectedFields.includes(field.id);
              const cover = STUDIO_CATALOG.plates.find((p) => p.fieldId === field.id);
              const ledColor = cover?.palette[2] ?? "#FF5A36";

              return (
                <motion.button
                  key={field.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleWorld(field.id)}
                  data-testid={`field-card-${field.id}`}
                  className={cn(
                    "slide-housing p-3 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer",
                    active
                      ? "ring-2 ring-primary opacity-100"
                      : "opacity-55 hover:opacity-85",
                  )}
                >
                  <div className="space-y-2.5 w-full">
                    {cover && <PlateSpecimen plate={cover} compact />}
                    <div className="px-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-base leading-tight">
                          {field.label}
                        </span>
                        <span
                          style={{
                            backgroundColor: active ? ledColor : "transparent",
                            boxShadow: active ? `0 0 10px ${ledColor}` : "none",
                          }}
                          className={cn(
                            "h-3 w-3 rounded-full border shrink-0 flex items-center justify-center",
                            active ? "border-transparent" : "border-muted-foreground/40",
                          )}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {field.coverHint}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Bottom Tactile Launch Dock */}
          <div className="slide-housing p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {([
                { n: 12 as const, label: "Quick Spin · 12 slides (~2 min)" },
                { n: 20 as const, label: "Deep Cut · 20 slides (~4 min)" },
              ]).map((opt) => (
                <button
                  key={opt.n}
                  type="button"
                  onClick={() => setDeckLength(opt.n)}
                  className={cn(
                    "spring-tap px-4 py-2 rounded-full text-xs font-semibold",
                    deckLength === opt.n
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setPromptIndex(0);
                setStage("play");
              }}
              className="tactile-pill rounded-full px-7 h-12 bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center justify-center gap-2"
              data-testid="button-enter-deck"
            >
              <span>Drop {selectedFields.length} worlds onto table</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      )}

      {/* ====================================================================
          STEP 2: PHYSICAL PLAYGROUND (ZERO SPOILERS MID-SESSION!)
          ==================================================================== */}
      {stage === "play" && currentPrompt && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col justify-between gap-4">
          {/* Minimalist Progress Beads + Loupe Toggle */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={promptIndex > 0 ? undoPrevious : () => setStage("worlds")}
              className="spring-tap px-3.5 py-1.5 rounded-full bg-secondary text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {promptIndex > 0 ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" /> Back
                </>
              ) : (
                <>
                  <ArrowLeft className="h-3.5 w-3.5" /> Worlds
                </>
              )}
            </button>

            {/* Segmented Light Beads */}
            <div className="flex items-center gap-1 flex-1 max-w-xs mx-auto">
              {queue.map((q, idx) => (
                <span
                  key={q.id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    idx < promptIndex
                      ? "bg-primary"
                      : idx === promptIndex
                        ? "bg-foreground scale-y-125"
                        : "bg-secondary",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {sessionSignals.length >= 5 && (
                <button
                  type="button"
                  onClick={() => {
                    setStubTorn(false);
                    setStage("ceremony");
                  }}
                  className="spring-tap px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold"
                >
                  Finish now →
                </button>
              )}
              <button
                type="button"
                onClick={skipCurrent}
                className="spring-tap px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground"
                data-testid="button-skip-plate"
              >
                Skip
              </button>
            </div>
          </div>

          {/* MODE A: SIDE-BY-SIDE LIGHT-TABLE SPLIT ("THIS OR THAT") */}
          {currentPrompt.kind === "foil_pair" && (() => {
            const plateA = platesById.get(currentPrompt.plateA.id)!;
            const plateB = platesById.get(currentPrompt.plateB.id)!;
            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPrompt.id}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ type: "spring", duration: 0.36, bounce: 0.12 }}
                  className="my-auto space-y-4"
                >
                  <div className="text-center space-y-1">
                    <h2 className="font-display font-bold text-2xl sm:text-3xl">
                      Which one pulls your eye in?
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Same creative problem, two opposite instincts. Tap the slide you trust.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { side: "A", plate: plateA, other: plateB },
                      { side: "B", plate: plateB, other: plateA },
                    ].map(({ side, plate, other }) => (
                      <motion.div
                        key={plate.id}
                        whileHover={{ y: -4 }}
                        className="slide-housing p-4 flex flex-col justify-between gap-3.5"
                      >
                        <div className="space-y-2.5">
                          <PlateSpecimen
                            plate={plate}
                            interactiveTilt
                            loupeEnabled={loupeActive}
                            className="aspect-auto h-48 sm:h-54 w-full"
                          />
                          <div className="px-1">
                            <div className="font-display font-bold text-lg leading-snug">
                              {plate.label}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{plate.subtitle}</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-1">
                              {plate.canonicalRef}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            recordAndAdvance([
                              {
                                plateId: plate.id,
                                mode: "pair",
                                value: 90,
                                critiqueTags: activeTags.length > 0 ? activeTags : undefined,
                              },
                              { plateId: other.id, mode: "pair", value: 24 },
                            ])
                          }
                          className="tactile-pill h-11 w-full rounded-full bg-foreground text-background font-display font-bold text-sm"
                          data-testid={`button-defend-${side.toLowerCase()}`}
                        >
                          Pick {plate.label.split(" ")[0]}
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        recordAndAdvance([
                          { plateId: plateA.id, mode: "pair", value: 78 },
                          { plateId: plateB.id, mode: "pair", value: 78 },
                        ])
                      }
                      className="spring-tap px-4 py-2 rounded-full bg-secondary text-xs font-semibold"
                    >
                      Love both in different moods
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        recordAndAdvance([
                          { plateId: plateA.id, mode: "pair", value: 12 },
                          { plateId: plateB.id, mode: "pair", value: 12 },
                        ])
                      }
                      className="spring-tap px-4 py-2 rounded-full bg-rose-500/15 text-rose-400 text-xs font-semibold"
                    >
                      Pass on both
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            );
          })()}

          {/* MODE B: SKEUOMORPHIC FM ROTARY TUNER */}
          {currentPrompt.kind === "craft_strip" && (() => {
            const stripPlates = currentPrompt.plates
              .map((p) => platesById.get(p.id)!)
              .filter(Boolean);
            const activePlate = stripPlates[tunerIdx] ?? stripPlates[0];

            return (
              <div className="max-w-xl mx-auto w-full my-auto space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="font-display font-bold text-2xl sm:text-3xl">
                    Tune it until it feels right to your eye.
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Slide across the 4 channels — same content, tuned to your sweet spot.
                  </p>
                </div>

                <div className="slide-housing p-4 sm:p-5 space-y-4">
                  <PlateSpecimen
                    plate={activePlate}
                    interactiveTilt
                    className="aspect-auto h-52 sm:h-58 w-full"
                  />

                  <div className="flex items-baseline justify-between px-1">
                    <div>
                      <div className="font-display font-bold text-xl">{activePlate.label}</div>
                      <div className="text-xs text-muted-foreground">{activePlate.subtitle}</div>
                    </div>
                    <span className="font-mono text-xs text-primary font-semibold tabular-nums">
                      0{tunerIdx + 1} / 0{stripPlates.length}
                    </span>
                  </div>

                  {/* Physical FM Tick-Tape Dial */}
                  <div className="tuner-well rounded-2xl p-3 space-y-2.5">
                    <div className="relative h-7 flex items-center justify-between px-4">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "w-0.5 rounded-full",
                            i % 8 === 0 ? "h-4 bg-foreground/65" : "h-2 bg-foreground/20",
                          )}
                        />
                      ))}
                      <motion.div
                        animate={{ left: `${12 + tunerIdx * 25.3}%` }}
                        transition={{ type: "spring", stiffness: 290, damping: 24 }}
                        className="pointer-events-none absolute top-0.5 bottom-0.5 w-1 rounded-full bg-primary shadow-[0_0_12px_#FF5A36]"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {stripPlates.map((sp, idx) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setTunerIdx(idx)}
                          className={cn(
                            "spring-tap py-2 px-1 rounded-xl text-xs font-semibold truncate",
                            tunerIdx === idx
                              ? "bg-foreground text-background shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {sp.label.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const entries = stripPlates.map((sp, idx) => {
                        const dist = Math.abs(idx - tunerIdx);
                        return {
                          plateId: sp.id,
                          mode: "rank" as const,
                          value: dist === 0 ? 95 : dist === 1 ? 65 : dist === 2 ? 32 : 12,
                        };
                      });
                      recordAndAdvance(entries);
                    }}
                    className="tactile-pill h-12 w-full rounded-full bg-primary text-primary-foreground font-display font-bold text-sm"
                    data-testid="button-confirm-craft"
                  >
                    Lock in {activePlate.label}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* MODE C: PHYSICAL THROW STACK + OPTICAL GLASS MAGNIFIER LOUPE */}
          {currentPrompt.kind === "critique_plate" && (() => {
            const plate = platesById.get(currentPrompt.plate.id)!;
            return (
              <div className="max-w-xl mx-auto w-full my-auto space-y-4">
                <div className="relative">
                  {/* Physical stacked cards peeking underneath */}
                  <div className="slide-housing absolute inset-0 translate-y-2.5 scale-[0.96] -rotate-2 opacity-40 pointer-events-none" />
                  <div className="slide-housing absolute inset-0 translate-y-1.5 scale-[0.98] rotate-1 opacity-65 pointer-events-none" />

                  <motion.div
                    key={plate.id}
                    drag={loupeActive ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.75}
                    style={{ x: dragX, rotate: cardRotate }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 95 || info.velocity.x > 480) {
                        recordAndAdvance([
                          {
                            plateId: plate.id,
                            mode: "rate",
                            value: 95,
                            critiqueTags: activeTags.length > 0 ? activeTags : undefined,
                          },
                        ]);
                      } else if (info.offset.x < -95 || info.velocity.x < -480) {
                        recordAndAdvance([
                          {
                            plateId: plate.id,
                            mode: "rate",
                            value: 10,
                            critiqueTags: activeTags.length > 0 ? activeTags : undefined,
                          },
                        ]);
                      }
                    }}
                    className="slide-housing relative p-4 sm:p-5 space-y-3.5 cursor-grab active:cursor-grabbing"
                  >
                    {/* Dynamic Swipe Aura Stamps */}
                    <motion.div
                      style={{ opacity: loveGlow }}
                      className="pointer-events-none absolute top-7 left-7 z-30 px-3 py-1 rounded-full bg-emerald-500 text-white font-display font-bold text-xs shadow-lg"
                    >
                      OBSESSED
                    </motion.div>
                    <motion.div
                      style={{ opacity: passGlow }}
                      className="pointer-events-none absolute top-7 right-7 z-30 px-3 py-1 rounded-full bg-rose-500 text-white font-display font-bold text-xs shadow-lg"
                    >
                      HARD PASS
                    </motion.div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                      <span>{plate.canonicalRef}</span>
                      <button
                        type="button"
                        onClick={() => setLoupeActive((v) => !v)}
                        className={cn(
                          "spring-tap px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px] font-semibold",
                          loupeActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Search className="h-3 w-3" />
                        <span>{loupeActive ? "Loupe On" : "2x Loupe"}</span>
                      </button>
                    </div>

                    <PlateSpecimen
                      plate={plate}
                      interactiveTilt={!loupeActive}
                      loupeEnabled={loupeActive}
                      className="aspect-auto h-52 sm:h-60 w-full"
                    />

                    <div className="px-0.5">
                      <h2 className="font-display font-bold text-xl sm:text-2xl leading-snug">
                        {plate.label}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {plate.subtitle}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Optional 1-Tap Gut Notes */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {CRITIQUE_TAGS.map((tag) => {
                    const active = activeTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "spring-tap px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          active
                            ? tag.polarity === "negative"
                              ? "bg-rose-500 text-white"
                              : "bg-primary text-primary-foreground"
                            : "bg-secondary/75 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tactile 4-Button Dock */}
                <div className="grid grid-cols-4 gap-2">
                  {REACTIONS.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() =>
                        recordAndAdvance([
                          {
                            plateId: plate.id,
                            mode: "rate",
                            value: r.value,
                            critiqueTags: activeTags.length > 0 ? activeTags : undefined,
                          },
                        ])
                      }
                      data-testid={`button-rate-${r.value}`}
                      className={cn(
                        "spring-tap h-12 rounded-2xl font-display font-bold text-xs sm:text-sm transition-colors",
                        r.pill,
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Quiet hint footer (ZERO mid-session archetype spoilers!) */}
          <div className="text-center text-xs text-muted-foreground/70">
            Slide {promptIndex + 1} of {queue.length} · Drag card or tap a reaction
          </div>
        </main>
      )}

      {/* ====================================================================
          STEP 3: CLIMACTIC TEAR-OFF PASS CEREMONY & PERMANENT PROFILE SAVE
          ==================================================================== */}
      {stage === "ceremony" && (() => {
        const aura = ceremonyResult.auraColors ?? ["#FF5A36", "#F59E0B", "#FB7185"];

        return (
          <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center relative">
            {/* Ambient Aura Burst once torn! */}
            <AnimatePresence>
              {stubTorn && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 0.32, scale: 1.15 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: `radial-gradient(circle, ${aura[0]} 0%, ${aura[1]} 55%, transparent 75%)`,
                  }}
                  className="pointer-events-none fixed inset-0 z-0 blur-3xl"
                />
              )}
            </AnimatePresence>

            <div className="w-full relative z-10 space-y-4">
              {/* SEALED STATE: Perforated Stub waiting to be torn open! */}
              {!stubTorn ? (
                <motion.div
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", duration: 0.55, bounce: 0.18 }}
                  className="slide-housing p-7 text-center space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <div
                      style={{
                        background: `conic-gradient(from 90deg, ${aura[0]}, ${aura[1]}, ${aura[2]}, ${aura[0]})`,
                      }}
                      className="w-20 h-20 rounded-full mx-auto blur-[2px] shadow-xl animate-spin [animation-duration:12s]"
                    />
                    <h1 className="font-display font-extrabold text-3xl pt-2">
                      Your Taste Pass is ready.
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {sessionSignals.length} visceral picks locked across {selectedFields.length}{" "}
                      creative worlds. Tear the perforated stub to reveal your result.
                    </p>
                  </div>

                  {/* Interactive Perforated Tear Line (Design Spells: FocusFlight) */}
                  <div className="perforated-divider pt-6">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96, rotate: -2 }}
                      onClick={() => setStubTorn(true)}
                      data-testid="button-tear-pass"
                      className="tactile-pill w-full h-13 rounded-full bg-primary text-primary-foreground font-display font-bold text-base inline-flex items-center justify-center gap-2.5"
                    >
                      <Scissors className="h-4 w-4" />
                      <span>Tear stub to reveal my taste</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                /* UNSEALED REVEAL CEREMONY + SAVE FOREVER */
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", duration: 0.55, bounce: 0.22 }}
                  className="slide-housing p-6 sm:p-8 space-y-6"
                >
                  <div className="text-center space-y-3">
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${aura[0]}, ${aura[1]}, ${aura[2]})`,
                      }}
                      className="w-20 h-20 rounded-3xl mx-auto shadow-lg flex items-center justify-center text-white font-display font-extrabold text-2xl rotate-3"
                    >
                      {Math.round(ceremonyResult.overallCoverage * 100)}%
                    </div>
                    <div className="text-xs font-semibold text-primary">Your Creative Eye</div>
                    <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">
                      {ceremonyArchetype.title}
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ceremonyArchetype.description}
                    </p>
                    {ceremonyResult.creativeRange.hasDuality && (
                      <div className="rounded-2xl bg-secondary/80 px-4 py-2.5 text-xs text-foreground">
                        {ceremonyResult.creativeRange.summary}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSaveForever} className="space-y-4 pt-2 border-t border-border">
                    <div className="font-display font-bold text-base">
                      Save your profile forever &amp; get your Blend link
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1 block">
                        <span className="text-xs text-muted-foreground">Choose your @handle *</span>
                        <input
                          required
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          placeholder="rudra"
                          data-testid="input-handle"
                          className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>

                      <label className="space-y-1 block">
                        <span className="text-xs text-muted-foreground">Display name</span>
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Rudra"
                          className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>
                    </div>

                    <label className="space-y-1 block">
                      <span className="text-xs text-muted-foreground">What do you make?</span>
                      <input
                        value={disciplineLine}
                        onChange={(e) => setDisciplineLine(e.target.value)}
                        placeholder="Architecture, UI, Fashion, Photography..."
                        className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    {!activeAccount && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label className="space-y-1 block">
                          <span className="text-xs text-muted-foreground">
                            Email (locks your handle)
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@studio.com"
                            className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                        <label className="space-y-1 block">
                          <span className="text-xs text-muted-foreground">Password</span>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Optional for quick test"
                            className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                      </div>
                    )}

                    {/* Optional Reference Upload (wired to Supabase Storage!) */}
                    <div className="rounded-2xl bg-secondary/55 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">
                          Optional: Pin 1 favorite work of yours or inspiration
                        </span>
                        <label className="spring-tap cursor-pointer px-3 py-1 rounded-full bg-card text-xs font-medium inline-flex items-center gap-1.5">
                          <Upload className="h-3 w-3 text-primary" />
                          <span>{uploadingImg ? "Uploading..." : refUploadedImg ? "Image ready" : "Upload image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImg(true);
                              try {
                                const url = await uploadUserReferenceImage(file, handle || "guest");
                                setRefUploadedImg(url);
                              } finally {
                                setUploadingImg(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <input
                          value={refTitle}
                          onChange={(e) => setRefTitle(e.target.value)}
                          placeholder="Title (e.g. Casa Gilardi)"
                          className="w-full h-9 rounded-lg bg-background px-3 text-xs focus:outline-none"
                        />
                        <input
                          value={refUrl}
                          onChange={(e) => setRefUrl(e.target.value)}
                          placeholder="Link (optional)"
                          className="w-full h-9 rounded-lg bg-background px-3 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      data-testid="button-publish-dossier"
                      className="tactile-pill w-full h-12 rounded-full bg-foreground text-background font-display font-bold text-sm inline-flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        {saving ? "Saving your Taste Card..." : "Save Profile & Unlock Blend Link"}
                      </span>
                    </button>
                  </form>
                </motion.div>
              )}
            </div>
          </main>
        );
      })()}
    </div>
  );
}
