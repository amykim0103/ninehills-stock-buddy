import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import OwnerDashboard from "./pages/OwnerDashboard.tsx";
import ItemsManagement from "./pages/ItemsManagement.tsx";
import History from "./pages/History.tsx";
import Recipes from "./pages/Recipes.tsx";
import { useStore } from "@/lib/store";
import { useRecipeStore } from "@/lib/recipeStore";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    useStore.getState().init();
    useRecipeStore.getState().init();
  }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/order" element={<OwnerDashboard />} />
          <Route path="/items" element={<ItemsManagement />} />
          <Route path="/history" element={<History />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
