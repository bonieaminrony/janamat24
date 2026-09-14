import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import { ThemeProvider } from "@/components/theme-provider";
import RealtimeTracker from "./components/RealtimeTracker";

// Lazy-loaded routes for instant initial homepage load
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ConverterPage = lazy(() => import("./pages/ConverterPage"));
const QuranPage = lazy(() => import("./pages/QuranPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));
const EditorialPolicyPage = lazy(() => import("./pages/EditorialPolicyPage"));
const CorrectionsPolicyPage = lazy(() => import("./pages/CorrectionsPolicyPage"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin routes (heavy dependencies like recharts, tiptap, html2canvas are isolated here)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminAdPartners = lazy(() => import("./pages/admin/AdminAdPartners"));
const AdminReporters = lazy(() => import("./pages/admin/AdminReporters"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminCardGenerator = lazy(() => import("./pages/admin/AdminCardGenerator"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep cached in memory for 30 mins
      retry: 1,
      retryDelay: 1000,
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
            <Suspense fallback={
              <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">জনমত ২৪</span>
              </div>
            }>
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
            </Suspense>
            </GlobalErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
