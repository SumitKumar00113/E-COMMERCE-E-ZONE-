import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";
import ToastContainer from "./components/ToastContainer";
import LandingPage from "./pages/LandingPage";
import ProductsPage from "./pages/ProductsPage";
import SearchPage from "./pages/SearchPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CreateProductPage from "./pages/CreateProductPage";
import LoginPage from "./pages/LoginPage";
import { useLenis } from "./hooks/useLenis";

export default function App() {
  const location = useLocation();
  useLenis();

  return (
    <>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              }
            />
            <Route
              path="/products"
              element={
                <PageTransition>
                  <ProductsPage />
                </PageTransition>
              }
            />
            <Route
              path="/products/:id"
              element={
                <PageTransition>
                  <ProductDetailPage />
                </PageTransition>
              }
            />
            <Route
              path="/search"
              element={
                <PageTransition>
                  <SearchPage />
                </PageTransition>
              }
            />
            <Route
              path="/create"
              element={
                <PageTransition>
                  <CreateProductPage />
                </PageTransition>
              }
            />
            <Route
              path="/login"
              element={
                <PageTransition>
                  <LoginPage />
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </Layout>
      <ToastContainer />
    </>
  );
}
