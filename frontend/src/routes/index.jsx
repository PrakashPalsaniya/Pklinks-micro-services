import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PrivateRoute } from "../components/PrivateRoute";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { setAccessToken } from "../api/tokenStore";

const HomePage = lazy(() => import("../pages/HomePage").then((module) => ({ default: module.HomePage })));
const AuthLayout = lazy(() => import("../pages/auth/AuthLayout").then((module) => ({ default: module.AuthLayout })));
const LoginPage = lazy(() => import("../pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import("../pages/auth/SignupPage").then((module) => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage })));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const LinksPage = lazy(() => import("../pages/links/LinksPage").then((module) => ({ default: module.LinksPage })));
const LinkDetailPage = lazy(() => import("../pages/links/LinkDetailPage").then((module) => ({ default: module.LinkDetailPage })));
const LinkAnalyticsPage = lazy(() => import("../pages/analytics/LinkAnalyticsPage").then((module) => ({ default: module.LinkAnalyticsPage })));
const RedirectPage = lazy(() => import("../pages/RedirectPage").then((module) => ({ default: module.RedirectPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

function RouteFallback() {
  return (
    <div className="grid gap-4 p-4 sm:p-6">
      <Skeleton className="h-24" />
      <Skeleton className="h-56" />
      <Skeleton className="h-40" />
    </div>
  );
}

function AuthRouteFallback() {
  return (
    <div className="min-h-screen bg-base px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-md gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

function withSuspense(element, fallback = <RouteFallback />) {
  return <Suspense fallback={fallback}>{element}</Suspense>;
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={withSuspense(<HomePage />)} />
        <Route path="/r/:code" element={withSuspense(<RedirectPage />)} />

        <Route element={<PublicOnlyRoute />}>
          <Route element={withSuspense(<AuthLayout />, <AuthRouteFallback />)}>
            <Route path="/login" element={withSuspense(<LoginPage />, <AuthRouteFallback />)} />
            <Route path="/signup" element={withSuspense(<SignupPage />, <AuthRouteFallback />)} />
            <Route path="/forgot-password" element={withSuspense(<ForgotPasswordPage />, <AuthRouteFallback />)} />
            <Route path="/reset-password" element={withSuspense(<ResetPasswordPage />, <AuthRouteFallback />)} />
          </Route>
        </Route>

        <Route
          path="/dashboard"
          element={(
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          )}
        >
          <Route index element={<DashboardPage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="links/:code" element={<LinkDetailPage />} />
          <Route path="links/:code/analytics" element={<LinkAnalyticsPage />} />
        </Route>

        <Route path="*" element={withSuspense(<NotFoundPage />)} />
      </Routes>
    </BrowserRouter>
  );
}
