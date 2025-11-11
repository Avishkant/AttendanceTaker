import { useEffect, useRef, useState } from "react";
import api from "../api";
import Toast from "../components/Toast"; // Assuming this component exists
import {
  FaLaptopCode,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaRedo,
  FaTimes,
} from "react-icons/fa";

// Helper component for status icons
const StatusPill = ({ status }) => {
  const s = (status || "pending").toString().toLowerCase();
  let Icon = FaHourglassHalf;
  let className = "bg-yellow-100 text-yellow-800";
  let label = s.toUpperCase();

  switch (s) {
    case "approved":
      Icon = FaCheckCircle;
      className = "bg-green-100 text-green-800";
      break;
    case "rejected":
      Icon = FaTimesCircle;
      className = "bg-red-100 text-red-800";
      break;
    case "pending":
    default:
      break;
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${className}`}
    >
      <span className="inline-block transform scale-100">
        <Icon className="w-3 h-3" />
      </span>
      {label}
    </span>
  );
};

export default function MyDevices() {
  // Format helper for display
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
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentUpdated, setRecentUpdated] = useState({});
  const prevStatuses = useRef({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const resp = await api.get("/devices/my-requests");
      if (resp.data?.success) {
        const data = resp.data.data || [];
        const updated = {};
        data.forEach((r) => {
          const prev = prevStatuses.current[r._id];
          if (prev && prev !== r.status) updated[r._id] = true;
        });
        if (Object.keys(updated).length) {
          setRecentUpdated((s) => ({ ...s, ...updated }));
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
        data.forEach((r) => (prevStatuses.current[r._id] = r.status));
        setRequests(data);
      } else setRequests([]);
    } catch (err) {
      setToast({ message: err.message || "Failed to load", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const deleteRequest = async (id) => {
    if (!confirm("Are you sure you want to delete this device change request?"))
      return;
    try {
      await api.delete(`/devices/requests/${id}`);
      setToast({ message: "Request deleted successfully.", type: "success" });
      fetchRequests();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
          <FaLaptopCode className="text-gray-600" /> My Device Requests
        </h1>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm transition shadow-md flex items-center gap-2"
        >
          <FaRedo className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No device change requests found.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((r) => (
              <li
                key={r._id}
                className={`py-4 hover:bg-gray-50 transition rounded-lg -mx-2 px-2 ${
                  recentUpdated[r._id] ? "status-flash" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-800">
                      New Device ID:{" "}
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono text-sm">
                        {r.newDeviceId}
                      </code>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Requested: {formatIsoToDDMMYYYYTime(r.requestedAt)}
                      {r.reviewedAt && (
                        <span className="ml-3">
                          | Reviewed: {formatIsoToDDMMYYYYTime(r.reviewedAt)}
                        </span>
                      )}
                    </div>
                    {r.adminNote && (
                      <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-100 rounded-lg border border-gray-200 italic max-w-xl">
                        Admin note: {r.adminNote}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusPill status={r.status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.status === "pending") deleteRequest(r._id);
                      }}
                      className={`text-red-600 p-2 rounded-full transition ${
                        r.status === "pending"
                          ? "hover:text-red-800 hover:bg-red-50"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      title={
                        r.status === "pending"
                          ? "Delete Request"
                          : "Action disabled"
                      }
                      aria-disabled={r.status !== "pending"}
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
