import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import QuizFieldsPage from "@/pages/quiz-fields";
import QuizCategoriesPage from "@/pages/quiz-categories";
import QuizRatePage from "@/pages/quiz-rate";
import QuizResultsPage from "@/pages/quiz-results";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/quiz" component={QuizFieldsPage} />
      <Route path="/quiz/categories" component={QuizCategoriesPage} />
      <Route path="/quiz/rate" component={QuizRatePage} />
      <Route path="/quiz/results/:sessionId" component={QuizResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
