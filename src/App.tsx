import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import ConverterPage from "./pages/ConverterPage";
import QuranPage from "./pages/QuranPage";
import SearchPage from "./pages/SearchPage";
import BookmarksPage from "./pages/BookmarksPage";
import PrivacyPage from "./pages/PrivacyPage";
import AdvertisePage from "./pages/AdvertisePage";
import EditorialPolicyPage from "./pages/EditorialPolicyPage";
import CorrectionsPolicyPage from "./pages/CorrectionsPolicyPage";
import AuthorPage from "./pages/AuthorPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNews from "./pages/admin/AdminNews";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminAdPartners from "./pages/admin/AdminAdPartners";
import AdminReporters from "./pages/admin/AdminReporters";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminCardGenerator from "./pages/admin/AdminCardGenerator";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import RealtimeTracker from "./components/RealtimeTracker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 3, // Cache data for 3 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#b91c1c', fontSize: '24px', fontWeight: 'bold' }}>একটি সমস্যা হয়েছে</h1>
          <p style={{ color: '#7f1d1d', margin: '10px 0' }}>পেজটি লোড করতে সমস্যা হয়েছে। পেজটি রিফ্রেশ করুন।</p>
          {isDev && (
            <pre style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', overflowX: 'auto', maxWidth: '80%', color: '#ef4444', border: '1px solid #fca5a5' }}>
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('spa')) {
      url.searchParams.delete('spa');
      const cleanUrl = url.pathname + url.search + url.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="janamt-theme" attribute="class">
        <TooltipProvider>
          <RealtimeTracker />
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <ScrollToTop />
            <GlobalErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/converter" element={<ConverterPage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/advertise" element={<AdvertisePage />} />
              <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
              <Route path="/corrections-policy" element={<CorrectionsPolicyPage />} />
              <Route path="/author/:userId" element={<AuthorPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="ads" element={<AdminAdPartners />} />
                <Route path="reporters" element={<AdminReporters />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="subscribers" element={<AdminSubscribers />} />
                <Route path="card-generator" element={<AdminCardGenerator />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </GlobalErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
