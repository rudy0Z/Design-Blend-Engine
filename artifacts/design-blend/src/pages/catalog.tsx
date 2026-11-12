import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Header } from "@/components/Header";
import { PlateSpecimen } from "@/components/PlateSpecimen";
import { STUDIO_CATALOG } from "@/lib/backend-provider";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const [worldFilter, setWorldFilter] = useState<string>("all");
  const [loupeMode, setLoupeMode] = useState(false);

  const filtered = useMemo(() => {
    return STUDIO_CATALOG.plates.filter(
      (p) => worldFilter === "all" || p.fieldId === worldFilter,
    );
  }, [worldFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight">
              68 slides across 8 creative worlds.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              Architecture, industrial hardware, cinema &amp; street film, fashion tailoring, print
              posters, lettering, motion, and digital apps.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLoupeMode((v) => !v)}
              className={cn(
                "spring-tap px-4 h-10 rounded-full text-xs font-semibold inline-flex items-center gap-1.5",
                loupeMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground",
              )}
            >
              <Search className="h-3.5 w-3.5" />
              <span>{loupeMode ? "2x Loupe Active" : "Enable 2x Glass Loupe"}</span>
            </button>
            <Link
              href="/capture"
              className="tactile-pill px-5 h-10 rounded-full bg-foreground text-background font-display font-bold text-xs inline-flex items-center"
            >
              Play Deck
            </Link>
          </div>
        </div>

        {/* World Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "All Worlds (68)" },
            ...STUDIO_CATALOG.fields.map((f) => ({ id: f.id, label: f.label })),
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWorldFilter(w.id)}
              className={cn(
                "spring-tap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                worldFilter === w.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Tactile Slide Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plate) => (
            <motion.article
              key={plate.id}
              whileHover={{ y: -3 }}
              className="slide-housing p-3.5 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2.5">
                <PlateSpecimen
                  plate={plate}
                  interactiveTilt={!loupeMode}
                  loupeEnabled={loupeMode}
                />
                <div className="px-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-bold text-lg leading-snug">{plate.label}</h2>
                    {plate.diagnosticKind === "anti_slop" && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-semibold shrink-0">
                        Slop Foil
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{plate.subtitle}</p>
                </div>
              </div>

              <div className="px-1 pt-2 border-t border-border/60 text-[11px] text-muted-foreground truncate">
                {plate.canonicalRef}
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
