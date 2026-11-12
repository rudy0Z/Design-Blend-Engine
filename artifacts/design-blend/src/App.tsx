import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";

const CapturePage = lazy(() => import("@/pages/capture"));
const CatalogPage = lazy(() => import("@/pages/catalog"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const BlendPage = lazy(() => import("@/pages/blend"));
const BlendInvitePage = lazy(() => import("@/pages/blend-invite"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span>LOADING SPECIMEN...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/capture" component={CapturePage} />
        <Route path="/catalog" component={CatalogPage} />
        <Route path="/profile/:username" component={ProfilePage} />
        <Route path="/blend/invite/:token" component={BlendInvitePage} />
        <Route path="/blend/:userA/:userB" component={BlendPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}
