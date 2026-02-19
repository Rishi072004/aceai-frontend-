import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Index from "./pages/Index.jsx";
import Interview from "./pages/Interview.jsx";
import ChatHistory from "./pages/ChatHistory.jsx";
import Feedback from "./pages/Feedback.jsx";
import InterviewFeedback from "./pages/InterviewFeedback.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import Pricing from "./pages/Pricing.jsx";
import Upgrade from "./pages/Upgrade.jsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/interview/:chatId" element={<Interview />} />
            <Route path="/history" element={<ChatHistory />} />
            <Route path="/feedback" element={<InterviewFeedback />} />
            <Route path="/feedback/:chatId" element={<Feedback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/upgrade" element={<Upgrade />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

