// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./hooks/useTheme";

// Import immédiat pour la page d'accueil (première page chargée)
import Landing from "./pages/Landing";

// Lazy loading pour toutes les autres pages (chargées à la demande)
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SireneImport = lazy(() => import("./pages/SireneImport"));
const Prospecting = lazy(() => import("./pages/Prospecting"));
const Settings = lazy(() => import("./pages/Settings"));
const Database = lazy(() => import("./pages/Database"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Clients = lazy(() => import("./pages/Clients"));
const EmailTemplates = lazy(() => import("./pages/EmailTemplates"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Admin = lazy(() => import("./pages/Admin"));
const Promo = lazy(() => import("./pages/Promo"));
const Partner = lazy(() => import("./pages/Partner"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const AffiliateJoin = lazy(() => import("./pages/AffiliateJoin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Composant de chargement simple
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-block h-12 w-12 border-4 border-border border-t-primary rounded-full mb-4 shadow-lg shadow-primary/20 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Chargement...
        </p>
      </div>
    </div>
  );
}


function AppContent() {
  const { user } = useAuth();

  return (
    <div className={user ? "flex min-h-screen bg-background" : "flex flex-col min-h-screen bg-background"}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="main-content" className={user ? "flex-1 px-4 py-8 pt-18 md:pt-8 overflow-x-hidden" : "flex-1 px-4 py-8"}>
        <div className="mx-auto max-w-7xl">
          <PageTransition>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Pages publiques */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/partenaire" element={<Partner />} />
              <Route
                path="/subscribe"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <Subscribe />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<About />} />
              <Route path="/promo" element={<Promo />} />
              <Route path="/ref/:code" element={<AffiliateJoin />} />

              {/* Pages protégées */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sirene"
                element={
                  <ProtectedRoute>
                    <SireneImport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prospecting"
                element={
                  <ProtectedRoute>
                    <Prospecting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/database"
                element={
                  <ProtectedRoute>
                    <Database />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partenaire/dashboard"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <PartnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/docs"
                element={
                  <ProtectedRoute>
                    <Documentation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <EmailTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/success"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <SuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout-success"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <CheckoutSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              {/* Page 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
        </div>
      </main>
      {!user && <Footer />}
    </div>
  );
}

// Composant pour initialiser le thème
function ThemeInitializer() {
  useTheme();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <ThemeInitializer />
            <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
