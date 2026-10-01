import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/i18n";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestOnlyRoute } from "@/components/auth/GuestOnlyRoute";
import { LocationProvider } from "@/context/LocationContext";
import { realtimeService } from "@/services/realtimeService";
import { getHomeRouteForRole } from "@/lib/roleRoutes";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { CitizenLayout } from "@/components/layout/CitizenLayout";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { RoleShell } from "@/components/layout/RoleShell";

import { DashboardPage } from "@/pages/DashboardPage";
import { LiveMapPage } from "@/pages/LiveMapPage";
import { CitizenReportPage } from "@/pages/CitizenReportPage";
import { TrackReportPage } from "@/pages/TrackReportPage";
import { IncidentListPage } from "@/pages/IncidentListPage";
import { IncidentDetailPage } from "@/pages/IncidentDetailPage";
import { CitizenDashboardPage } from "@/pages/CitizenDashboardPage";
import { NationalMapPage } from "@/pages/NationalMapPage";
import { AdminVerificationQueuePage } from "@/pages/AdminVerificationQueuePage";
import { AdminAuditLogPage } from "@/pages/AdminAuditLogPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { MyReportsPage } from "@/pages/MyReportsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function AuthGate() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Navigate to={getHomeRouteForRole(user?.role)} replace />;
}

export function App() {
  useEffect(() => {
    realtimeService.initialize(queryClient);
    return () => {
      realtimeService.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LocationProvider>
            <Routes>
                {/* Guest / Auth Layout Routes */}
                <Route element={<GuestOnlyRoute />}>
                  <Route element={<AuthLayout />}>
                    <Route path="/" element={<AuthGate />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                  </Route>
                </Route>

                {/* Redirects */}
                <Route path="/welcome" element={<Navigate to="/" replace />} />
                <Route
                  path="/verification"
                  element={<Navigate to="/admin/queue" replace />}
                />

                {/* Citizen Only (CitizenLayout) */}
                <Route element={<ProtectedRoute roles={["CITIZEN"]} />}>
                  <Route element={<CitizenLayout />}>
                    <Route
                      path="/citizen-dashboard"
                      element={<CitizenDashboardPage />}
                    />
                  </Route>
                </Route>

                {/* Staff Only: OPERATOR & ADMIN (StaffLayout) */}
                <Route element={<ProtectedRoute roles={["OPERATOR", "ADMIN"]} />}>
                  <Route element={<StaffLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route
                      path="/admin/queue"
                      element={<AdminVerificationQueuePage />}
                    />
                    <Route
                      path="/admin/audit-logs"
                      element={<AdminAuditLogPage />}
                    />
                  </Route>
                </Route>

                {/* Shared CITIZEN + ADMIN (RoleShell) */}
                <Route element={<ProtectedRoute roles={["CITIZEN", "ADMIN"]} />}>
                  <Route element={<RoleShell />}>
                    <Route path="/report" element={<CitizenReportPage />} />
                    <Route path="/track-report" element={<TrackReportPage />} />
                    <Route path="/my-reports" element={<MyReportsPage />} />
                  </Route>
                </Route>

                {/* Shared All Roles (RoleShell) */}
                <Route
                  element={
                    <ProtectedRoute roles={["CITIZEN", "OPERATOR", "ADMIN"]} />
                  }
                >
                  <Route element={<RoleShell />}>
                    <Route path="/live-map" element={<LiveMapPage />} />
                    <Route path="/national-map" element={<NationalMapPage />} />
                    <Route path="/incidents" element={<IncidentListPage />} />
                    <Route
                      path="/incidents/:id"
                      element={<IncidentDetailPage />}
                    />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
