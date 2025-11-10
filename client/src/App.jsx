import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyDevices from "./pages/MyDevices";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmployees from "./pages/AdminEmployees";
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
                  <EmployeeDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/devices"
            element={
              <PrivateRoute roles={["employee", "admin"]}>
                <Layout>
                  <MyDevices />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <AdminEmployees />
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
