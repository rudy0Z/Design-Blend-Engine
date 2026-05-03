import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Check, AlertCircle } from "lucide-react";
import { useListStyles, useCreateQuizSession } from "@workspace/api-client-react";
import { FIELD_LABEL } from "@/lib/fields";
import { cn } from "@/lib/utils";

function useQueryParam(name: string): string {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  return params.get(name) ?? "";
}

export default function QuizCategoriesPage() {
  const [, setLocation] = useLocation();
  const fieldsParam = useQueryParam("fields");
  const fields = useMemo(
    () => fieldsParam.split(",").filter(Boolean),
    [fieldsParam],
  );

  const { data: nodes, isLoading, isError, error, refetch } = useListStyles({ depth: 2 });

  const categoriesByField = useMemo(() => {
    const map = new Map<string, { id: string; label: string }[]>();
    if (!nodes) return map;
    for (const n of nodes) {
      if (!fields.includes(n.field)) continue;
      const arr = map.get(n.field) ?? [];
      arr.push({ id: n.id, label: n.label });
      map.set(n.field, arr);
    }
    return map;
  }, [nodes, fields]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  const allCatIds = useMemo(() => {
    const ids: string[] = [];
    categoriesByField.forEach((cats) => cats.forEach((c) => ids.push(c.id)));
    return ids;
  }, [categoriesByField]);

  // Default-select all categories the first time they load (effect, not render)
  useEffect(() => {
    if (!initialized.current && allCatIds.length > 0) {
      initialized.current = true;
      setSelected(new Set(allCatIds));
    }
  }, [allCatIds]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const createSession = useCreateQuizSession();

  function start() {
    createSession.mutate(
      {
        data: {
          selectedFields: fields,
          selectedCategories: Array.from(selected),
        },
      },
      {
        onSuccess: (session) => {
          setLocation(`/quiz/rate?session=${session.id}`);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md" data-testid="text-categories-error">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="mt-3 font-semibold text-foreground">Couldn't load categories.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message ?? "Please try again."}
          </p>
          <Button
            className="mt-6"
            onClick={() => refetch()}
            data-testid="button-retry-categories"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="text-sm text-muted-foreground tracking-wide uppercase mb-3">Step 2 of 3</div>
        <h1
          className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground"
          data-testid="text-categories-title"
        >
          Narrow it down
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Tap a category to skip it. Leave the ones you want to be quizzed on.
        </p>

        <div className="mt-10 space-y-10">
          {fields.map((fieldId) => {
            const cats = categoriesByField.get(fieldId) ?? [];
            return (
              <div key={fieldId}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  {FIELD_LABEL[fieldId] ?? fieldId}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => {
                    const isSel = selected.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(c.id)}
                        data-testid={`button-category-${c.id}`}
                        className={cn(
                          "rounded-full border-2 px-4 py-2 text-sm font-medium transition-all hover-elevate",
                          isSel
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-muted/30 text-muted-foreground line-through",
                        )}
                      >
                        {isSel && <Check className="inline h-3 w-3 mr-1" />}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {createSession.isError && (
          <div
            className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            data-testid="text-create-session-error"
          >
            Couldn't start the quiz: {(createSession.error as Error)?.message ?? "unknown error"}
          </div>
        )}

        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-muted-foreground" data-testid="text-categories-count">
            {selected.size} of {allCatIds.length} categories selected
          </div>
          <Button
            size="lg"
            onClick={start}
            disabled={selected.size === 0 || createSession.isPending}
            data-testid="button-start-rating"
          >
            {createSession.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Start rating
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
