import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Share2 } from "lucide-react";
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
          A guided descent through a graph of design styles. React to images,
          and we'll map your taste fingerprint across 8 dimensions, give you a
          designer archetype, and a card you can blend with anyone.
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
            icon={<Sparkles className="h-5 w-5" />}
            title="Adaptive"
            body="Each rating reshapes the path. We ask the smallest number of questions to find your fingerprint."
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="8-axis taste vector"
            body="From Order ↔ Chaos to Literal ↔ Abstract. Plus one of 32 designer archetypes."
          />
          <Feature
            icon={<Share2 className="h-5 w-5" />}
            title="Shareable & blendable"
            body="Save your card, send it to a friend, see how your tastes overlap."
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
