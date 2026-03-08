import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import AdminPanel from "@/pages/AdminPanel";
import ProtectedRoute from "@/components/ProtectedRoute";
import "@/App.css";

// Lazy-loaded new pages
import { lazy, Suspense } from "react";
const AuthChoice  = lazy(() => import("@/pages/AuthChoice"));
const DevLogin    = lazy(() => import("@/pages/DevLogin"));
const SellYourArt = lazy(() => import("@/pages/SellYourArt"));
const CreatorShop  = lazy(() => import("@/pages/CreatorShop"));
const Drops        = lazy(() => import("@/pages/Drops"));
const SizeGuide    = lazy(() => import("@/pages/SizeGuide"));
const About        = lazy(() => import("@/pages/About"));
const FAQ          = lazy(() => import("@/pages/FAQ"));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: '24px', color: 'rgba(250,250,249,0.3)' }}>
      Caesura.
    </div>
  </div>
);

function AppRouter() {
  const location = useLocation();

  // CRITICAL: Check URL fragment synchronously during render to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"               element={<Landing />} />
          {/* Marketplace — both /marketplace and /explore work */}
          <Route path="/marketplace"    element={<Marketplace />} />
          <Route path="/explore"        element={<Marketplace />} />
          <Route path="/explore/:filter" element={<Marketplace />} />
          {/* Product detail — new /t/:id path + old /product/:id */}
          <Route path="/t/:productId"   element={<ProductDetail />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          {/* New pages */}
          <Route path="/drops"          element={<Drops />} />
          <Route path="/sell"           element={<SellYourArt />} />
          <Route path="/artist/:userId" element={<CreatorShop />} />
          <Route path="/size-guide"     element={<SizeGuide />} />
          <Route path="/about"          element={<About />} />
          <Route path="/faq"            element={<FAQ />} />
          <Route path="/join"           element={<AuthChoice />} />
          <Route path="/dev-login"      element={<DevLogin />} />
          {/* Protected */}
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/cart"           element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout"       element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"         element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin"          element={<AdminPanel />} />
        </Routes>
      </Suspense>
      <Toaster theme="dark" />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
