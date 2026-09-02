import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { api, type Catalog, type CatalogPlate, type PendingResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

type Step = "field" | "category" | "rate" | "finish";

const QUICK_RATINGS = [
  { label: "Love", value: 90 },
  { label: "Like", value: 70 },
  { label: "Meh", value: 40 },
  { label: "Nope", value: 15 },
];

/** SERVER enforces the same minimum. */
const MIN_RATINGS = 6;
/** Bounded queue: the "under 15 minutes" promise needs a stoppable flow. */
const MAX_PLATES = 24;

export default function CapturePage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [step, setStep] = useState<Step>("field");
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<PendingResponse[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [slider, setSlider] = useState(70);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [handle, setHandle] = useState(user?.username ?? "");

  const { data: catalog, isLoading, isError } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api<Catalog>("/api/catalog"),
  });

  const field = catalog?.fields.find((f) => f.id === fieldId) ?? null;
  const plateByCategory = useMemo(() => {
    const map = new Map<string, CatalogPlate[]>();
    for (const p of catalog?.plates ?? []) {
      const list = map.get(p.categoryId) ?? [];
      list.push(p);
      map.set(p.categoryId, list);
    }
    return map;
  }, [catalog]);

  // Flatten selected categories into one rating queue, bounded so a
  // multi-category selection can never become an endless form.
  const queue = useMemo(
    () => categoryIds.flatMap((c) => plateByCategory.get(c) ?? []).slice(0, MAX_PLATES),
    [categoryIds, plateByCategory],
  );
  const ratedIds = useMemo(() => new Set(responses.map((r) => r.plateId)), [responses]);
  const current = queue.find((p) => !ratedIds.has(p.id)) ?? null;
  const ratedCount = responses.length;

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const { sessionId: id } = await api<{ sessionId: string }>("/api/capture/sessions", {
      method: "POST",
    });
    setSessionId(id);
    return id;
  }

  function record(plate: CatalogPlate, value: number | null) {
    // null value = skip → skip = unknown, never recorded (FINAL-PLAN.md §1).
    if (value === null) {
      advance(responses);
      return;
    }
    const next: PendingResponse[] = [
      ...responses,
      { plateId: plate.id, mode: "rate" as const, value, sequence: responses.length },
    ];
    setResponses(next);
    advance(next);
  }

  function advance(list: PendingResponse[]) {
    const rated = new Set(list.map((r) => r.plateId));
    if (queue.every((p) => rated.has(p.id))) {
      setStep("finish");
    } else {
      setSlider(70);
    }
  }

  async function finish() {
    setError(null);
    setSubmitting(true);
    try {
      const id = await ensureSession();
      if (responses.length > 0) {
        await api(`/api/capture/sessions/${id}/responses`, {
          method: "POST",
          body: JSON.stringify({ responses }),
        });
      }
      const result = await api<{ username: string }>(
        `/api/capture/sessions/${id}/complete`,
        { method: "POST", body: JSON.stringify({ username: handle || undefined }) },
      );
      setLocation(`/profile/${result.username}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !catalog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <p className="text-destructive">
          Catalog unavailable. Is the API running with a seeded database?
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        {step === "field" && (
          <section data-testid="step-field">
            <h1 className="text-3xl font-serif font-semibold">Where do you design?</h1>
            <p className="mt-2 text-muted-foreground">
              Pick the world closest to yours. Images only — no reading required.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {catalog.fields.map((f) => (
                <button
                  key={f.id}
                  data-testid={`field-${f.id}`}
                  onClick={() => {
                    setFieldId(f.id);
                    setStep("category");
                  }}
                  className="group text-left rounded-2xl border border-border bg-card p-8 hover-elevate transition-all"
                >
                  <div className="h-28 rounded-xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent mb-5" />
                  <div className="text-xl font-serif font-semibold">{f.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {f.categories.length} categories
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "category" && field && (
          <section data-testid="step-category">
            <button
              onClick={() => setStep("field")}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <h1 className="text-3xl font-serif font-semibold">{field.label}</h1>
            <p className="mt-2 text-muted-foreground">
              Choose what you want to react to. Each is a short run of images.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {field.categories.map((c) => {
                const plates = plateByCategory.get(c.id) ?? [];
                const selected = categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    data-testid={`category-${c.id}`}
                    onClick={() =>
                      setCategoryIds((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((x) => x !== c.id)
                          : [...prev, c.id],
                      )
                    }
                    className={cn(
                      "text-left rounded-2xl border p-6 transition-all hover-elevate",
                      selected ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{c.label}</div>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {plates.length} plates ready
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              size="lg"
              className="mt-8 w-full h-12"
              disabled={categoryIds.length === 0}
              onClick={() => setStep("rate")}
              data-testid="button-start-rating"
            >
              Start rating
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </section>
        )}

        {step === "rate" && (
          <section data-testid="step-rate">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>
                {ratedCount} rated · {queue.length - ratedCount} to go
              </span>
              <button
                onClick={() => setStep("category")}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <X className="h-3 w-3" /> Change categories
              </button>
            </div>
            {ratedCount >= MIN_RATINGS && (
              <div className="mb-5">
                <Button
                  variant="outline"
                  onClick={finish}
                  disabled={submitting}
                  data-testid="button-finish-early"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Build my profile with {ratedCount} rated
                </Button>
              </div>
            )}
            {current ? (
              <div
                className="rounded-2xl border border-border bg-card overflow-hidden"
                data-testid={`plate-${current.id}`}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {current.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt={current.altText}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm px-8 text-center">
                      Plate image pending curation — rating still counts toward your
                      fingerprint.
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted-foreground">{current.creditLine}</p>
                  <Slider
                    value={[slider]}
                    onValueChange={(v) => setSlider(v[0])}
                    max={100}
                    step={5}
                    className="mt-4"
                    data-testid="slider-rate"
                  />
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {QUICK_RATINGS.map((q) => (
                      <Button
                        key={q.label}
                        variant="outline"
                        onClick={() => record(current, q.value)}
                        data-testid={`rate-${q.label.toLowerCase()}`}
                      >
                        {q.label}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-xs">
                    <button
                      onClick={() => record(current, slider)}
                      className="text-primary font-medium"
                      data-testid="rate-slider"
                    >
                      Rate {slider}
                    </button>
                    <button
                      onClick={() => record(current, null)}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="rate-skip"
                    >
                      Skip (unknown)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">All plates rated.</div>
            )}
          </section>
        )}

        {step === "finish" && (
          <section data-testid="step-finish" className="text-center py-10">
            <h1 className="text-3xl font-serif font-semibold">That's your fingerprint forming.</h1>
            <p className="mt-2 text-muted-foreground">
              {ratedCount} plates rated. Claim it with a handle.
            </p>
            <div className="mt-8 max-w-sm mx-auto">
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                placeholder="your-handle"
                data-testid="input-handle"
              />
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              <Button
                size="lg"
                className="mt-4 w-full h-12"
                onClick={finish}
                disabled={submitting || ratedCount < 6}
                data-testid="button-complete"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Build my profile
              </Button>
              {ratedCount < 6 && (
                <p className="mt-3 text-xs text-muted-foreground">Rate at least 6 plates first.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
