import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserShield,
  FaSignOutAlt,
  FaDownload,
  FaAddressCard,
  FaUsers,
  FaPlusCircle,
  FaGlobe,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheck,
  FaBan,
  FaRedo,
} from "react-icons/fa";

// --- Custom Styled Components (White Theme) ---

const StyledInput = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  />
);

const StyledTextarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  />
);

// Motion variants for staggered entrance
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [companyIps, setCompanyIps] = useState("");
  const [editingIps, setEditingIps] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true); // Retaining loading state for best practice

  // --- Data Fetching Functions ---

  const fetchRequests = async () => {
    /* ... (unchanged logic) ... */
    try {
      const resp = await api.get("/devices/requests");
      if (resp.data?.success) setRequests(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    /* ... (unchanged logic) ... */
    try {
      const resp = await api.get("/admin/employees");
      if (resp.data?.success) setEmployees(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanyIps = async () => {
    /* ... (unchanged logic) ... */
    try {
      const resp = await api.get("/admin/settings/company-ips");
      if (resp.data?.success) setCompanyIps((resp.data.data || []).join(", "));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRequests(), fetchEmployees(), fetchCompanyIps()]).finally(
      () => setLoading(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // --- Employee Management Functions ---

  const submitEmployee = async (e) => {
    /* ... (unchanged logic) ... */
    e.preventDefault();
    try {
      const resp = await api.post("/admin/employees", form);
      if (resp.data?.success) {
        setToast({ message: "Employee created successfully", type: "success" });
        setForm({ name: "", email: "", password: "", role: "employee" });
        fetchEmployees();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  // --- IP Settings Management Functions ---

  const saveCompanyIps = async () => {
    /* ... (unchanged logic) ... */
    try {
      const arr = companyIps
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const resp = await api.put("/admin/settings/company-ips", { ips: arr });
      if (resp.data?.success) {
        setToast({ message: "Company IPs updated", type: "success" });
        fetchCompanyIps();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const toggleEditIps = (id, current = []) => {
    /* ... (unchanged logic) ... */
    setEditingIps((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? undefined : (current || []).join(", "),
    }));
  };

  const saveEmployeeIps = async (id) => {
    /* ... (unchanged logic) ... */
    try {
      const raw = editingIps[id] || "";
      const arr = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const resp = await api.patch(`/admin/employees/${id}/allowed-ips`, {
        allowedIPs: arr,
      });
      if (resp.data?.success) {
        setToast({ message: "Employee allowed IPs updated", type: "success" });
        setEditingIps((prev) => ({ ...prev, [id]: undefined }));
        fetchEmployees();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  // --- Device Request Review Functions ---

  const review = async (id, action) => {
    /* ... (unchanged logic) ... */
    try {
      const resp = await api.post(`/devices/requests/${id}/${action}`);
      if (resp.data?.success) {
        setToast({ message: `Request ${action}ed`, type: "success" });
        fetchRequests();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  // --- Export Report Function ---

  const exportCsv = async () => {
    /* ... (unchanged logic) ... */
    try {
      const resp = await api.get("/admin/reports/export", {
        responseType: "blob",
      });
      const blob = new Blob([resp.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `attendance_${Date.now()}.csv`;
      link.click();
      setToast({ message: "CSV downloaded", type: "success" });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  // --- Render UI ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4"
        >
          <h1 className="text-3xl font-extrabold text-gray-800">
            <FaUserShield className="inline mr-3 text-gray-600" /> Admin Control
            Panel
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/requests")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow-md"
            >
              <FaAddressCard /> Requests Dashboard
            </button>
            <button
              onClick={exportCsv}
              // Dark Gray Button on White background for primary action
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow-md"
            >
              <FaDownload /> Export Attendance CSV
            </button>
            <button
              onClick={logout}
              // Light Gray Button for secondary action
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow-md"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </motion.div>

        {/* Main Grid Sections */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Column 1: Employees and IP Settings */}
          <motion.div
            className="lg:col-span-2 space-y-8"
            variants={itemVariants}
          >
            {/* 1. Company Global IP Settings */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <FaGlobe className="text-gray-600" /> Global IP Whitelist
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                IP addresses/CIDRs allowed company-wide for attendance clock-in
                (comma separated).
              </p>
              <label className="block text-sm mb-1 text-gray-700">
                Allowed IPs / CIDRs
              </label>
              <StyledTextarea
                value={companyIps}
                onChange={(e) => setCompanyIps(e.target.value)}
                rows={4}
                className="mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={saveCompanyIps}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition shadow-md"
                >
                  <FaSave className="inline mr-1" /> Save Global IPs
                </button>
                <button
                  onClick={fetchCompanyIps}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg transition"
                >
                  <FaRedo className="inline mr-1" /> Reload
                </button>
              </div>
            </div>

            {/* 2. Employee List */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <FaUsers className="text-gray-600" /> Employee List (
                {employees.length})
              </h2>
              <ul className="divide-y divide-gray-200">
                {employees.length === 0 && (
                  <p className="text-gray-500">No employees found</p>
                )}
                {employees.map((u) => (
                  <motion.li
                    key={u._id}
                    className="py-4"
                    variants={itemVariants}
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }} // Subtle hover effect
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {u.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {u.email} —{" "}
                          <span
                            className={
                              u.role === "admin"
                                ? "text-gray-800 font-medium"
                                : "text-gray-600"
                            }
                          >
                            {u.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleEditIps(u._id, u.allowedIPs)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <FaEdit /> Manage IPs
                      </button>
                    </div>

                    {/* Current Allowed IPs Display */}
                    <div className="mt-2">
                      <span className="text-xs font-semibold text-gray-500">
                        Allowed IPs:
                      </span>
                      <div className="text-sm text-gray-700 break-words">
                        {(u.allowedIPs || []).join(", ") ||
                          "None (Using Company Global IPs)"}
                      </div>
                    </div>

                    {/* Employee IP Edit Form (Conditional) */}
                    {editingIps[u._id] !== undefined && (
                      <motion.div
                        className="mt-3 p-3 bg-gray-100 rounded-lg border border-gray-200"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-sm mb-1 text-gray-700">
                          Employee Specific IPs (Override Global)
                        </label>
                        <StyledTextarea
                          value={editingIps[u._id]}
                          onChange={(e) =>
                            setEditingIps((prev) => ({
                              ...prev,
                              [u._id]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mb-2"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => saveEmployeeIps(u._id)}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition"
                          >
                            <FaSave className="inline mr-1" /> Save Employee IPs
                          </button>
                          <button
                            onClick={() => toggleEditIps(u._id)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg transition"
                          >
                            <FaTimes className="inline mr-1" /> Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Column 2: Requests and Add Employee */}
          <div className="lg:col-span-1 space-y-8">
            {/* device change request */}
            {/* <motion.div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200" variants={itemVariants}>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2"><FaAddressCard className="text-gray-600"/> Device Change Requests ({requests.length})</h2>
                    <ul className="divide-y divide-gray-200">
                        {requests.length === 0 && <p className="text-gray-500">No pending requests</p>}
                        {requests.map((r) => (
                            <motion.li 
                                key={r._id} 
                                className="py-3"
                                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {r.user?.name} 
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            New Device ID: <span className="text-gray-700">{r.newDeviceId}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Requested: {new Date(r.requestedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => review(r._id, "approve")}
                                            className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1 rounded-lg text-sm transition shadow-sm"
                                        >
                                            <FaCheck className="inline mr-1"/> Approve
                                        </button>
                                        <button
                                            onClick={() => review(r._id, "reject")}
                                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1 rounded-lg text-sm transition shadow-sm"
                                        >
                                            <FaBan className="inline mr-1"/> Reject
                                        </button>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div> */}

            {/* 4. Add New Employee Form */}
            {/* <motion.div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200" variants={itemVariants}>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2"><FaPlusCircle className="text-gray-600"/> Add New Employee</h2>
                    <form onSubmit={submitEmployee} className="space-y-3">
                        <StyledInput name="name" required value={form.name} onChange={handleChange} placeholder="Full Name" />
                        <StyledInput name="email" required type="email" value={form.email} onChange={handleChange} placeholder="Email" />
                        <StyledInput name="password" required type="password" value={form.password} onChange={handleChange} placeholder="Password" />
                        
                        <div className="pt-2">
                            <label className="block text-sm text-gray-700 mb-1">Role</label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800"
                            >
                                <option value="employee" className="bg-white text-gray-900">Employee</option>
                                <option value="admin" className="bg-white text-gray-900">Admin</option>
                            </select>
                        </div>
                        
                        <div className="pt-3">
                            <button
                                type="submit"
                                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition shadow-md w-full"
                            >
                                <FaPlusCircle className="inline mr-1"/> Create Account
                            </button>
                        </div>
                    </form>
                </motion.div> */}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
