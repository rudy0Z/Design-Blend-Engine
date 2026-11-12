import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { PlateSpecimen } from "@/components/PlateSpecimen";
import {
  STUDIO_CATALOG,
  getActiveHandle,
  resolveStudioInvite,
} from "@/lib/backend-provider";

export default function BlendInvitePage() {
  const { token = "" } = useParams<{ token: string }>();
  const resolved = resolveStudioInvite(token);
  const activeHandle = getActiveHandle();

  if (!resolved) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            That Blend ticket couldn&apos;t be found.
          </h1>
          <Link
            href="/capture"
            className="tactile-pill px-7 h-12 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center"
          >
            Play the 2-Min Taste Deck
          </Link>
        </main>
      </div>
    );
  }

  const { inviter } = resolved;
  const latest = inviter.versions[inviter.versions.length - 1].data;
  const aura = latest.auraColors ?? ["#FF5A36", "#F59E0B", "#FB7185"];
  const heroPlate = latest.topPlates[0]
    ? STUDIO_CATALOG.plates.find((p) => p.id === latest.topPlates[0].plateId)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div
        style={{
          background: `radial-gradient(500px circle at 50% 30%, ${aura[0]}38, transparent 70%)`,
        }}
        className="pointer-events-none fixed inset-0 -z-10 blur-3xl"
      />
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.16 }}
          className="slide-housing max-w-md w-full p-6 sm:p-8 space-y-5 text-center"
        >
          <div
            style={{
              background: `conic-gradient(from 45deg, ${aura[0]}, ${aura[1]}, ${aura[2]}, ${aura[0]})`,
            }}
            className="h-16 w-16 rounded-3xl mx-auto shadow-lg"
          />

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-3xl leading-tight">
              {inviter.displayName} invited you to Blend taste.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Play a quick 2-minute round across your favorite creative worlds to merge your Taste
              Aura with @{inviter.username} and unlock your 5-card Blend story.
            </p>
          </div>

          {heroPlate && <PlateSpecimen plate={heroPlate} compact />}

          <div className="pt-2">
            {activeHandle && activeHandle !== inviter.username ? (
              <Link
                href={`/blend/${inviter.username}/${activeHandle}`}
                className="tactile-pill h-12 w-full rounded-full bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center justify-center gap-2"
              >
                <span>Open @{inviter.username} × @{activeHandle} Blend</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/capture"
                className="tactile-pill h-12 w-full rounded-full bg-primary text-primary-foreground font-display font-bold text-sm inline-flex items-center justify-center gap-2"
              >
                <span>Play 2-Min Deck to Blend</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
