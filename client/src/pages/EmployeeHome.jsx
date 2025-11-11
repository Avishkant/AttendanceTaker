import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

const AttendanceButton = ({ onClick, disabled, type, loading }) => {
  const baseClass =
    "px-6 py-3 rounded-lg text-white font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2";
  const variantClass =
    type === "in"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-yellow-600 hover:bg-yellow-700";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass}`}
    >
      {loading ? "..." : `Mark ${type === "in" ? "In" : "Out"}`}
    </button>
  );
};

const formatTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mon}/${yyyy} ${hh}:${mm}:${ss}`;
};

export default function EmployeeHome() {
  const { user, logout } = useAuth();
  const [todayRecords, setTodayRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchToday = useCallback(async () => {
    try {
      const t = new Date();
      const start = new Date(
        t.getFullYear(),
        t.getMonth(),
        t.getDate()
      ).toISOString();
      const end = new Date(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        23,
        59,
        59,
        999
      ).toISOString();
      const resp = await api.get("/attendance/history", {
        params: { from: start, to: end, limit: 50 },
      });
      if (resp.data?.success) setTodayRecords(resp.data.data || []);
      else setTodayRecords([]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const mark = async (type) => {
    setLoading(true);
    try {
      const resp = await api.post("/attendance/mark", { type });
      if (resp.data?.success) {
        showToast("Attendance marked", "success");
        fetchToday();
      } else {
        showToast(resp.data?.message || "Blocked", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // derive first IN and last OUT from today's records
  const firstIn = todayRecords
    .filter((r) => r.type === "in")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
  const lastOut = todayRecords
    .filter((r) => r.type === "out")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <AttendanceButton
              onClick={() => mark("in")}
              type="in"
              loading={loading}
            />
            <AttendanceButton
              onClick={() => mark("out")}
              type="out"
              loading={loading}
            />
            <button
              onClick={() => (window.location.href = "/employee/devices")}
              className="ml-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Request Device Change
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Today's First IN</div>
              <div className="text-lg font-medium mt-2">
                {firstIn ? formatTime(firstIn.timestamp) : "—"}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600">Today's Last OUT</div>
              <div className="text-lg font-medium mt-2">
                {lastOut ? formatTime(lastOut.timestamp) : "—"}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            You can use the buttons above to quickly mark your attendance and
            cross-check today's timestamps.
          </div>
        </div>
      </div>
    </div>
  );
}
