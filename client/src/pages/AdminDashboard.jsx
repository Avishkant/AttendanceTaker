import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
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

  const fetchRequests = async () => {
    try {
      const resp = await api.get("/devices/requests");
      if (resp.data?.success) setRequests(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const resp = await api.get("/admin/employees");
      if (resp.data?.success) setEmployees(resp.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanyIps = async () => {
    try {
      const resp = await api.get("/admin/settings/company-ips");
      if (resp.data?.success) setCompanyIps((resp.data.data || []).join(","));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
    fetchCompanyIps();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submitEmployee = async (e) => {
    e.preventDefault();
    try {
      const resp = await api.post("/admin/employees", form);
      if (resp.data?.success) {
        setToast({ message: "Employee created", type: "success" });
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

  const saveCompanyIps = async () => {
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
    setEditingIps((prev) => ({
      ...prev,
      [id]: prev[id] ? undefined : (current || []).join(","),
    }));
  };

  const saveEmployeeIps = async (id) => {
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

  const review = async (id, action) => {
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

  const exportCsv = async () => {
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

  return (
    <div className="p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Admin Dashboard — {user?.name}</h1>
        <div>
          <button
            onClick={exportCsv}
            className="mr-2 bg-blue-600 text-white px-3 py-2 rounded"
          >
            Export CSV
          </button>
          <button
            onClick={logout}
            className="bg-gray-600 text-white px-3 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl mb-3">Company Allowed IPs</h2>
          <div className="bg-white shadow rounded p-4 mb-4">
            <label className="block text-sm mb-1">
              Allowed IPs / CIDRs (comma separated)
            </label>
            <textarea
              value={companyIps}
              onChange={(e) => setCompanyIps(e.target.value)}
              className="w-full border px-2 py-1 rounded h-24 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={saveCompanyIps}
                className="bg-blue-600 text-white px-3 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => fetchCompanyIps()}
                className="bg-gray-200 px-3 py-2 rounded"
              >
                Reload
              </button>
            </div>
          </div>

          <h2 className="text-xl mb-3">Employees</h2>
          <div className="bg-white shadow rounded p-4 mb-4">
            {employees.length === 0 && <p>No employees found</p>}
            <ul>
              {employees.map((u) => (
                <li key={u._id} className="border-b py-2 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-sm text-gray-600">
                        {u.email} — {u.role}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleEditIps(u._id, u.allowedIPs)}
                        className="bg-yellow-400 text-white px-2 py-1 rounded"
                      >
                        Manage IPs
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">
                      Current allowed IPs:{" "}
                      {(u.allowedIPs || []).join(", ") || "—"}
                    </div>
                  </div>
                  {editingIps[u._id] !== undefined && (
                    <div className="mt-2">
                      <textarea
                        value={editingIps[u._id]}
                        onChange={(e) =>
                          setEditingIps((prev) => ({
                            ...prev,
                            [u._id]: e.target.value,
                          }))
                        }
                        className="w-full border px-2 py-1 rounded h-20 mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEmployeeIps(u._id)}
                          className="bg-blue-600 text-white px-3 py-2 rounded"
                        >
                          Save IPs
                        </button>
                        <button
                          onClick={() =>
                            setEditingIps((prev) => ({
                              ...prev,
                              [u._id]: undefined,
                            }))
                          }
                          className="bg-gray-200 px-3 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <h3 className="text-lg mb-2">Add Employee</h3>
          <form
            onSubmit={submitEmployee}
            className="bg-white shadow rounded p-4"
          >
            <div className="mb-2">
              <label className="block text-sm">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border px-2 py-1 rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border px-2 py-1 rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border px-2 py-1 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded"
              >
                Create
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-xl mb-3">Device Change Requests</h2>
          <div className="bg-white shadow rounded p-4">
            {requests.length === 0 && <p>No requests</p>}
            <ul>
              {requests.map((r) => (
                <li key={r._id} className="border-b py-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div>
                        <strong>{r.user?.name}</strong> ({r.user?.email})
                      </div>
                      <div className="text-sm text-gray-600">
                        Device: {r.newDeviceId} — Requested:{" "}
                        {new Date(r.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => review(r._id, "approve")}
                        className="mr-2 bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => review(r._id, "reject")}
                        className="bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
