import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthProvider";
import { Navigation } from "@/components/Navigation";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";
import JobDetails from "@/pages/JobDetails";
import Auth from "@/pages/Auth";
import EmailVerification from "@/pages/EmailVerification";
import Profile from "@/pages/Profile";
import Employer from "@/pages/Employer";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetails} />
      
      {/* Auth routes */}
      <Route path="/auth" component={Auth} />
      <Route path="/verify" component={EmailVerification} />
      
      {/* Protected routes */}
      <Route path="/profile" component={Profile} />
      <Route path="/employer" component={Employer} />
      <Route path="/admin" component={Admin} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
