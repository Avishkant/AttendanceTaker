import { useEffect, useState, useCallback, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [reqNote, setReqNote] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const formRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchHistory = useCallback(async () => {
    try {
      const resp = await api.get("/attendance/history");
      if (resp.data?.success) setHistory(resp.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch the current user's device-change requests and update pending state
  const fetchMyRequests = useCallback(async () => {
    try {
      const resp = await api.get("/devices/my-requests");
      if (resp.data?.success) {
        const list = resp.data.data || [];
        setMyRequests(list);
        const pending = list.find((r) => r.status === "pending");
        setPendingRequest(pending || null);
        return list;
      }
    } catch (err) {
      console.debug("failed to fetch my-requests", err);
    }
    return [];
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchMyRequests();
  }, [fetchHistory, fetchMyRequests]);

  // Poll my-requests while a pending request exists so employee UI updates after admin action
  useEffect(() => {
    if (!pendingRequest) return;
    const id = setInterval(() => {
      fetchMyRequests();
    }, 5000);
    return () => clearInterval(id);
  }, [pendingRequest, fetchMyRequests]);

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
    if (pendingRequest) {
      showToast(
        "You already have a pending device-change request. Please wait for admin review.",
        "error"
      );
      return;
    }
    try {
      const deviceId = localStorage.getItem("deviceId");
      const resp = await api.post("/devices/request-change", {
        deviceId,
        note: reqNote,
      });
      if (resp.data?.success) {
        showToast("Device change request submitted", "success");
        // update pending state
        setPendingRequest(resp.data.data || null);
        // refresh list
        try {
          const r2 = await api.get("/devices/my-requests");
          if (r2.data?.success) setMyRequests(r2.data.data || []);
        } catch (err) {
          // ignore but log for debugging
          console.debug("refresh my-requests failed", err);
        }
      } else showToast(resp.data?.message || "Error", "error");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
      // If server sent back existing request id, refresh pending state
      const rid = err.response?.data?.requestId;
      if (rid) setPendingRequest({ _id: rid, status: "pending" });
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
        <div className="flex items-center">
          <button
            onClick={() =>
              formRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            disabled={!!pendingRequest}
            className="mr-3 bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
          >
            {pendingRequest ? "Request Pending" : "Request Device Change"}
          </button>
          <button
            onClick={async () => {
              setRefreshing(true);
              await fetchMyRequests();
              setRefreshing(false);
            }}
            className="mr-3 bg-gray-200 text-gray-800 px-3 py-2 rounded"
          >
            {refreshing ? "Refreshing..." : "Refresh requests"}
          </button>
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
      </div>

      <section className="mb-6" ref={formRef}>
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
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={!!pendingRequest}
            >
              {pendingRequest ? "Request Pending" : "Request Change"}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-6">
        <h2 className="text-xl mb-3">Device Change Requests</h2>
        <div className="bg-white shadow rounded p-4">
          {myRequests.length === 0 && <p>No device change requests</p>}
          <ul>
            {myRequests.map((r) => (
              <li key={r._id} className="border-b py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>Device:</strong> {r.newDeviceId}
                    <div className="text-sm text-gray-600">
                      Requested: {new Date(r.requestedAt).toLocaleString()}
                      {r.reviewedAt && (
                        <span>
                          {" "}
                          - Reviewed: {new Date(r.reviewedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        r.status === "pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : r.status === "approved"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>

                    {/* allow owner or admin to delete the request entirely */}
                    {(String(r.user) === String(user?.id) ||
                      user?.role === "admin") && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this request permanently?"))
                            return;
                          try {
                            const resp = await api.delete(
                              `/devices/requests/${r._id}`
                            );
                            if (resp.data?.success) {
                              showToast("Request deleted", "success");
                              await fetchMyRequests();
                            } else {
                              showToast(resp.data?.message || "Error", "error");
                            }
                          } catch (err) {
                            showToast(
                              err.response?.data?.message || err.message,
                              "error"
                            );
                          }
                        }}
                        className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {r.adminNote && (
                  <div className="mt-2 text-sm text-gray-700">
                    Admin note: {r.adminNote}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
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
