import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function MyDevices() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchRequests = async () => {
    try {
      const resp = await api.get("/devices/my-requests");
      if (resp.data?.success) setRequests(resp.data.data);
    } catch (err) {
      setToast({ message: err.message || "Failed to load", type: "error" });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h1 className="text-2xl mb-4">My Device Requests — {user?.name}</h1>
      <div className="bg-white shadow rounded p-4">
        {requests.length === 0 && <p>No device requests</p>}
        <ul>
          {requests.map((r) => (
            <li key={r._id} className="border-b py-2">
              <div className="flex justify-between">
                <div>
                  <div>
                    <strong>Device:</strong> {r.newDeviceId}
                  </div>
                  <div className="text-sm text-gray-600">
                    Requested: {new Date(r.requestedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm">
                  <span
                    className={`px-2 py-1 rounded ${
                      r.status === "approved"
                        ? "bg-green-200 text-green-800"
                        : r.status === "rejected"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
              {r.adminNote && (
                <div className="text-sm text-gray-600 mt-1">
                  Admin note: {r.adminNote}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
