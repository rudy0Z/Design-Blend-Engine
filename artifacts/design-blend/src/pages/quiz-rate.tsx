import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Loader2, X, Heart, SkipForward, Sliders, AlertCircle } from "lucide-react";
import {
  useGetNextStyle,
  useSubmitRating,
  useCompleteQuizSession,
  getGetNextStyleQueryKey,
  type StyleNode,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { FIELD_LABEL } from "@/lib/fields";
import { cn } from "@/lib/utils";

function useSessionId(): string {
  const search = typeof window !== "undefined" ? window.location.search : "";
  return new URLSearchParams(search).get("session") ?? "";
}

export default function QuizRatePage() {
  const sessionId = useSessionId();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const {
    data: nextData,
    isLoading,
    isError: nextIsError,
    error: nextError,
    refetch: refetchNext,
  } = useGetNextStyle(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetNextStyleQueryKey(sessionId),
      staleTime: 0,
      gcTime: 0,
    },
  });

  const submitRating = useSubmitRating();
  const completeSession = useCompleteQuizSession();

  // Prefetch the next style image once the current node is loaded so swiping feels instant.
  // We can't know the next node's URL ahead of time (server picks adaptively), but we can
  // warm the browser cache for it as soon as the new "next" payload arrives.
  const prefetchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const url = nextData?.node?.imageUrl;
    if (!url || prefetchedRef.current.has(url)) return;
    prefetchedRef.current.add(url);
    const img = new Image();
    img.src = url;
  }, [nextData?.node?.imageUrl]);
  const [completing, setCompleting] = useState(false);

  const node = nextData?.node ?? null;
  const done = nextData?.done ?? false;
  const progress = nextData?.progress ?? 0;
  const target = nextData?.target ?? 1;
  const ratedCount = nextData?.ratedCount ?? 0;

  // When server signals done, finalize and route to results
  useEffect(() => {
    if (done && sessionId && !completing) {
      setCompleting(true);
      completeSession.mutate(
        { id: sessionId },
        {
          onSuccess: () => setLocation(`/quiz/results/${sessionId}`),
          onError: () => setCompleting(false),
        },
      );
    }
  }, [done, sessionId, completing, completeSession, setLocation]);

  // Track when image has loaded so we can measure response time
  const shownAtRef = useRef<number | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  useEffect(() => {
    setImageReady(false);
    setShowSlider(false);
    setSliderValue(50);
    shownAtRef.current = null;
  }, [node?.id]);

  function handleImageLoaded() {
    if (!imageReady) {
      shownAtRef.current = performance.now();
      setImageReady(true);
    }
  }

  function submit(rating: number) {
    if (!node || !sessionId || submitRating.isPending) return;
    const responseTimeMs =
      shownAtRef.current != null
        ? Math.max(0, Math.round(performance.now() - shownAtRef.current))
        : undefined;
    submitRating.mutate(
      {
        id: sessionId,
        data: { nodeId: node.id, rating, responseTimeMs },
      },
      {
        onSuccess: () => {
          // Invalidate "next" so we get a fresh question
          queryClient.invalidateQueries({
            queryKey: getGetNextStyleQueryKey(sessionId),
          });
        },
      },
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground">No quiz session found.</p>
          <Button className="mt-4" onClick={() => setLocation("/quiz")} data-testid="button-restart">
            Start a new quiz
          </Button>
        </div>
      </div>
    );
  }

  if (completing || (done && !nextData?.node)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground" data-testid="text-finalizing">
          Computing your taste fingerprint…
        </p>
      </div>
    );
  }

  if (nextIsError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md" data-testid="text-rate-error">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="mt-3 font-semibold text-foreground">Couldn't load the next style.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(nextError as Error)?.message ?? "Please try again."}
          </p>
          <Button className="mt-6" onClick={() => refetchNext()} data-testid="button-retry-next">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !node) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 pt-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground" data-testid="text-progress-counter">
            {ratedCount + 1} of ~{target}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {Math.round((progress / target) * 100)}%
          </div>
        </div>
        <Progress value={(progress / target) * 100} className="h-1" data-testid="progress-quiz" />
        {submitRating.isError && (
          <div
            className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            data-testid="text-submit-error"
          >
            Couldn't save that rating: {(submitRating.error as Error)?.message ?? "unknown error"}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="relative w-full" style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait">
            <RatingCard
              key={node.id}
              node={node}
              onSubmit={submit}
              onImageLoad={handleImageLoaded}
              disabled={submitRating.isPending}
            />
          </AnimatePresence>
        </div>

        <div className="mt-6 w-full">
          {showSlider ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Not for me</span>
                <span className="font-mono font-semibold text-foreground" data-testid="text-slider-value">
                  {sliderValue}
                </span>
                <span className="text-muted-foreground">Sold</span>
              </div>
              <Slider
                value={[sliderValue]}
                onValueChange={(v) => setSliderValue(v[0] ?? 50)}
                min={0}
                max={100}
                step={1}
                data-testid="slider-rating"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSlider(false)}
                  data-testid="button-slider-cancel"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => submit(sliderValue)}
                  disabled={submitRating.isPending}
                  data-testid="button-slider-submit"
                >
                  Submit
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              <ActionButton
                onClick={() => submit(0)}
                disabled={submitRating.isPending}
                testid="button-rate-nope"
                ariaLabel="Not for me"
              >
                <X className="h-5 w-5" />
              </ActionButton>
              {[1, 2, 3, 4].map((stars) => (
                <ActionButton
                  key={stars}
                  onClick={() => submit(stars * 20)}
                  disabled={submitRating.isPending}
                  testid={`button-rate-${stars}`}
                  ariaLabel={`${stars} stars`}
                >
                  <span className="font-mono font-semibold text-sm">{stars}★</span>
                </ActionButton>
              ))}
              <ActionButton
                onClick={() => submit(100)}
                disabled={submitRating.isPending}
                testid="button-rate-love"
                ariaLabel="Love it"
                primary
              >
                <Heart className="h-5 w-5 fill-current" />
              </ActionButton>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              onClick={() => submit(40)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              disabled={submitRating.isPending}
              data-testid="button-skip"
            >
              <SkipForward className="h-3 w-3" /> Skip (counts as 2★)
            </button>
            <button
              onClick={() => setShowSlider((v) => !v)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-slider"
            >
              <Sliders className="h-3 w-3" /> Use slider
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  children,
  testid,
  ariaLabel,
  primary,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  testid: string;
  ariaLabel: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testid}
      className={cn(
        "h-12 rounded-xl border-2 flex items-center justify-center transition-all hover-elevate active-elevate-2 disabled:opacity-50",
        primary
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function RatingCard({
  node,
  onSubmit,
  onImageLoad,
  disabled,
}: {
  node: StyleNode;
  onSubmit: (rating: number) => void;
  onImageLoad: () => void;
  disabled: boolean;
}) {
  const dragHint = useMemo(() => Math.random(), []);
  void dragHint;

  function onDragEnd(_e: unknown, info: PanInfo) {
    if (disabled) return;
    if (info.offset.x > 120) onSubmit(100);
    else if (info.offset.x < -120) onSubmit(0);
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-muted shadow-lg cursor-grab active:cursor-grabbing"
      data-testid={`card-style-${node.id}`}
    >
      <img
        src={node.imageUrl}
        alt={node.label}
        loading="lazy"
        onLoad={onImageLoad}
        onError={onImageLoad}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="text-xs uppercase tracking-wider text-white/70" data-testid={`text-style-context-${node.id}`}>
          {FIELD_LABEL[node.field] ?? node.field} · {node.domain}
        </div>
        <div className="text-2xl font-serif font-semibold text-white mt-1" data-testid={`text-style-label-${node.id}`}>
          {node.label}
        </div>
      </div>
    </motion.div>
  );
}
