import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Images, Compass, Zap, Share2 } from "lucide-react";
import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">

        <h1
          className="text-5xl sm:text-7xl font-serif font-bold tracking-tight leading-[0.95] text-foreground"
          data-testid="text-hero-headline"
        >
          What does your <span className="text-primary">design taste</span> actually look like?
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-hero-sub">
          React to a curated catalog of credited design work — every choice is an
          image, never a label. We map your taste across 8 axes, match you to an
          archetype, and blend you with another designer using the plates you
          both actually rated.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/capture">
            <Button size="lg" className="text-base px-8 h-12" data-testid="button-start-quiz">
              Build your taste profile
              <Zap className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/blend/alba/marlow">
            <Button variant="outline" size="lg" className="text-base px-6 h-12" data-testid="button-view-demo-blend">
              See a sample blend
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-6">
          <Feature
            icon={<Images className="h-5 w-5" />}
            title="Image-led, always"
            body="Rate real, credited work. Skipping counts as unknown — the model never invents a preference you didn't state."
          />
          <Feature
            icon={<Compass className="h-5 w-5" />}
            title="8-axis fingerprint"
            body="From Order ↔ Chaos to Literal ↔ Abstract, with honest per-axis coverage so you can see what the model actually knows."
          />
          <Feature
            icon={<Share2 className="h-5 w-5" />}
            title="Blends that show their work"
            body="A percentage with coverage, plus the exact plates you both scored. No AI in the score, ever — and your taste versions forward when you change your mind."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground" data-testid={`text-feature-${title.toLowerCase().replace(/\s/g, "-")}`}>
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
