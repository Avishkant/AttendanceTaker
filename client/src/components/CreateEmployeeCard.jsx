import { useState } from "react";
import api from "../api";

export default function CreateEmployeeCard({
  onClose,
  onCreated,
  className = "",
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await api.post("/admin/employees", form);
      if (resp.data?.success) {
        onCreated && onCreated(resp.data.data);
        onClose && onClose();
      } else {
        setError(resp.data?.message || "Failed to create");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-3">Create Employee</h3>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Name"
          value={form.name}
          onChange={handleChange("name")}
          required
        />
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          required
        />
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          required
        />
        <select
          className="w-full border px-3 py-2 rounded"
          value={form.role}
          onChange={handleChange("role")}
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded"
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
