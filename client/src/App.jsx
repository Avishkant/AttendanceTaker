import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyDevices from "./pages/MyDevices";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import AdminEmployees from "./pages/AdminEmployees";
import AdminMarkAttendance from "./pages/AdminMarkAttendance";
import Layout from "./components/Layout";
import "./App.css";

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/employee"
            element={
              <PrivateRoute roles={["employee", "admin"]}>
                <Layout>
                  <ErrorBoundary>
                    <EmployeeDashboard />
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/devices"
            element={
              <PrivateRoute roles={["employee", "admin"]}>
                <Layout>
                  <ErrorBoundary>
                    <MyDevices />
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <ErrorBoundary>
                    <AdminDashboard />
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <ErrorBoundary>
                    <AdminRequests />
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/mark-attendance"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <ErrorBoundary>
                    <AdminMarkAttendance />
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <ErrorBoundary>
                    <AdminEmployees />
                  </ErrorBoundary>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/employee" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
