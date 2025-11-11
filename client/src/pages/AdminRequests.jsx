import { useEffect, useRef, useState } from "react";
import * as logger from "../lib/logger";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import {
  FaCheck,
  FaBan,
  FaArrowLeft,
  FaAddressCard,
  FaTrash,
} from "react-icons/fa";

// Format helper for display: dd/mm/yyyy HH:MM:SS
const formatIsoToDDMMYYYYTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

const RequestCard = ({ r, onApprove, onReject, onDelete, updated }) => {
  const isPending = (r.status || "pending") === "pending";
  const statusLabel = (r.status || "pending").toUpperCase();
  const statusClass = isPending
    ? "bg-yellow-100 text-yellow-800"
    : r.status === "approved"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${
        updated ? "status-flash" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="font-semibold text-gray-900">{r.user?.name}</div>
          <div className="text-sm text-gray-600">
            New Device: <span className="text-gray-700">{r.newDeviceId}</span>
            <span
              className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Requested: {formatIsoToDDMMYYYYTime(r.requestedAt)}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => isPending && onApprove(r._id)}
            disabled={!isPending}
            className={`px-3 py-1 rounded-lg text-sm border ${
              isPending
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
          >
            <FaCheck className="inline mr-1" /> Approve
          </button>
          <button
            onClick={() => isPending && onReject(r._id)}
            disabled={!isPending}
            className={`px-3 py-1 rounded-lg text-sm border ${
              isPending
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
          >
            <FaBan className="inline mr-1" /> Reject
          </button>
          <button
            onClick={() => onDelete && onDelete(r._id)}
            className="px-3 py-1 rounded-lg text-sm border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
          >
            <FaTrash className="inline mr-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminRequests() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUpdated, setRecentUpdated] = useState({});
  const prevStatuses = useRef({});

  const fetchRequests = async () => {
    try {
      const resp = await api.get("/devices/requests");
      if (resp.data?.success) {
        const data = resp.data.data || [];
        // detect status transitions
        const updated = {};
        data.forEach((r) => {
          const prev = prevStatuses.current[r._id];
          if (prev && prev !== r.status) updated[r._id] = true;
        });
        if (Object.keys(updated).length) {
          setRecentUpdated((s) => ({ ...s, ...updated }));
          // clear highlights after 1600ms
          Object.keys(updated).forEach((id) => {
            setTimeout(() => {
              setRecentUpdated((s) => {
                const copy = { ...s };
                delete copy[id];
                return copy;
              });
            }, 1600);
          });
        }
        // update prevStatuses
        data.forEach((r) => (prevStatuses.current[r._id] = r.status));
        setRequests(data);
      }
    } catch (err) {
      logger.error(err);
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRequests().finally(() => setLoading(false));
  }, []);

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

  const deleteRequest = async (id) => {
    if (!confirm("Delete this request?")) return;
    try {
      const resp = await api.delete(`/devices/requests/${id}`);
      if (resp.data?.success) {
        setToast({ message: "Request deleted", type: "success" });
        fetchRequests();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaAddressCard className="text-2xl text-gray-700" />
            <h1 className="text-2xl font-bold">Device Change Requests</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg"
            >
              <FaArrowLeft className="inline mr-1" /> Back
            </button>
            <button
              onClick={logout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading && <div className="text-gray-500">Loading...</div>}
          {!loading && requests.length === 0 && (
            <div className="text-gray-500">No pending requests</div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {requests.map((r) => (
              <RequestCard
                key={r._id}
                r={r}
                onApprove={(id) => review(id, "approve")}
                onReject={(id) => review(id, "reject")}
                onDelete={(id) => deleteRequest(id)}
                updated={!!recentUpdated[r._id]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
