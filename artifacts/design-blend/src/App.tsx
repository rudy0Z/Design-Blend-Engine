import { useEffect, useRef } from "react";
import {
  Switch,
  Route,
  Router as WouterRouter,
  useLocation,
} from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ClerkProvider, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildAppearance } from "@/lib/clerk-appearance";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import CapturePage from "@/pages/capture";
import QuizFieldsPage from "@/pages/quiz-fields";
import QuizCategoriesPage from "@/pages/quiz-categories";
import QuizRatePage from "@/pages/quiz-rate";
import QuizResultsPage from "@/pages/quiz-results";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import ProfilePage from "@/pages/profile";
import BlendPage from "@/pages/blend";
import BlendInvitePage from "@/pages/blend-invite";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/capture" component={CapturePage} />
      <Route path="/quiz" component={QuizFieldsPage} />
      <Route path="/quiz/categories" component={QuizCategoriesPage} />
      <Route path="/quiz/rate" component={QuizRatePage} />
      <Route path="/quiz/results/:sessionId" component={QuizResultsPage} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/blend/invite/:token" component={BlendInvitePage} />
      <Route path="/blend/:userA/:userB" component={BlendPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={buildAppearance(basePath)}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-destructive">Missing VITE_CLERK_PUBLISHABLE_KEY.</p>
      </div>
    );
  }
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
