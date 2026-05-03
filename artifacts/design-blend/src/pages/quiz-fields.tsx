import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { FIELDS } from "@/lib/fields";
import { cn } from "@/lib/utils";

export default function QuizFieldsPage() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<Set<string>>(new Set(["gd", "ui"]));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function next() {
    const fields = Array.from(selected).join(",");
    setLocation(`/quiz/categories?fields=${fields}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-20">
        <div className="text-sm text-muted-foreground tracking-wide uppercase mb-3">Step 1 of 3</div>
        <h1
          className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground"
          data-testid="text-fields-title"
        >
          Which fields do you live in?
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Pick at least one. We'll only quiz you on styles that are relevant.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {FIELDS.map((field) => {
            const isSelected = selected.has(field.id);
            return (
              <button
                key={field.id}
                onClick={() => toggle(field.id)}
                data-testid={`button-field-${field.id}`}
                className={cn(
                  "text-left rounded-xl border-2 p-6 transition-all relative hover-elevate",
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-3">{field.emoji}</div>
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="text-lg font-semibold text-foreground" data-testid={`text-field-label-${field.id}`}>
                  {field.label}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{field.blurb}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div className="text-sm text-muted-foreground" data-testid="text-fields-count">
            {selected.size} selected
          </div>
          <Button
            size="lg"
            onClick={next}
            disabled={selected.size === 0}
            data-testid="button-fields-continue"
          >
            Continue
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
