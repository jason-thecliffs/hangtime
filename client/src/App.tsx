import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import CreateEvent from "@/pages/create-event";
import EventView from "@/pages/event-view";
import Participate from "@/pages/participate";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateEvent} />
      <Route path="/event/:shareId">
        {(params) => <EventView shareId={params.shareId} />}
      </Route>
      <Route path="/participate/:shareId">
        {(params) => <Participate shareId={params.shareId} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
