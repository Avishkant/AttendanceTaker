import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const resp = await api.get("/devices/requests");
      if (resp.data?.success) setRequests(resp.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const [toast, setToast] = useState(null);

  const review = async (id, action) => {
    try {
      const resp = await api.post(`/devices/requests/${id}/${action}`);
      if (resp.data?.success) fetchRequests();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const exportCsv = async () => {
    try {
      // fetch with auth header to ensure token is sent
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

      <section>
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
      </section>
    </div>
  );
}
