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
import AdminPanel from "@/pages/AdminPanel";
import ProtectedRoute from "@/components/ProtectedRoute";
import "@/App.css";
import { lazy, Suspense } from "react";

const AuthChoice  = lazy(() => import("@/pages/AuthChoice"));
const DevLogin    = lazy(() => import("@/pages/DevLogin"));
const SellYourArt = lazy(() => import("@/pages/SellYourArt"));
const CreatorShop = lazy(() => import("@/pages/CreatorShop"));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: '24px', color: 'rgba(250,250,249,0.3)' }}>
      Caesura.
    </div>
  </div>
);

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                    element={<Landing />} />
          <Route path="/marketplace"         element={<Marketplace />} />
          <Route path="/explore"             element={<Marketplace />} />
          <Route path="/explore/:filter"     element={<Marketplace />} />
          <Route path="/t/:productId"        element={<ProductDetail />} />
          <Route path="/product/:productId"  element={<ProductDetail />} />
          <Route path="/sell"                element={<SellYourArt />} />
          <Route path="/artist/:userId"      element={<CreatorShop />} />
          <Route path="/join"                element={<AuthChoice />} />
          <Route path="/dev-login"           element={<DevLogin />} />
          <Route path="/dashboard"           element={<Dashboard />} />
          <Route path="/cart"                element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout"            element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"              element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin"               element={<AdminPanel />} />
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
