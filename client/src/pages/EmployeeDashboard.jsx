import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [reqNote, setReqNote] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const resp = await api.get("/attendance/history");
      if (resp.data?.success) setHistory(resp.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const showToast = (message, type = "info") => setToast({ message, type });

  const mark = async (type) => {
    setLoading(true);
    try {
      const resp = await api.post("/attendance/mark", { type });
      if (resp.data?.success) {
        showToast("Attendance marked", "success");
        fetchHistory();
      } else {
        showToast(resp.data?.message || "Blocked", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    try {
      const deviceId = localStorage.getItem("deviceId");
      const resp = await api.post("/devices/request-change", {
        deviceId,
        note: reqNote,
      });
      if (resp.data?.success) {
        showToast("Device change request submitted", "success");
      } else showToast(resp.data?.message || "Error", "error");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
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
        <h1 className="text-2xl">Welcome, {user?.name}</h1>
        <div>
          <button
            onClick={() => mark("in")}
            disabled={loading}
            className="mr-2 bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50"
          >
            Mark In
          </button>
          <button
            onClick={() => mark("out")}
            disabled={loading}
            className="mr-2 bg-yellow-600 text-white px-3 py-2 rounded disabled:opacity-50"
          >
            Mark Out
          </button>
          <button
            onClick={logout}
            className="bg-gray-600 text-white px-3 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-xl mb-3">Request Device Change</h2>
        <form onSubmit={submitRequest} className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-600 mb-2">
            Current device id:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {localStorage.getItem("deviceId")}
            </code>
          </p>
          <label className="block mb-2">Note (optional)</label>
          <textarea
            value={reqNote}
            onChange={(e) => setReqNote(e.target.value)}
            className="w-full border p-2 mb-3"
          />
          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Request Change
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl mb-3">Attendance History</h2>
        <div className="bg-white shadow rounded p-4">
          {history.length === 0 && <p>No records yet</p>}
          <ul>
            {history.map((h) => (
              <li key={h._id} className="border-b py-2">
                <strong>{h.type.toUpperCase()}</strong> —{" "}
                {new Date(h.timestamp).toLocaleString()} — IP: {h.ip}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
