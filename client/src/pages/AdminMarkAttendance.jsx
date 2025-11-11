import { useEffect, useState } from "react";
import api from "../api";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const StyledInput = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  />
);

const StyledSelect = ({ className = "", children, ...props }) => (
  <select
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  >
    {children}
  </select>
);

const StyledButton = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  let baseStyle =
    "px-3 py-2 rounded-lg text-sm transition shadow-md flex items-center justify-center gap-1";
  let variantStyle = "";

  switch (variant) {
    case "success":
      variantStyle = "bg-green-600 text-white hover:bg-green-700";
      break;
    case "danger":
      variantStyle = "bg-red-600 text-white hover:bg-red-700";
      break;
    case "secondary":
      variantStyle = "bg-gray-200 text-gray-800 hover:bg-gray-300";
      break;
    case "ghost":
      variantStyle = "text-gray-600 hover:bg-gray-100 shadow-none";
      break;
    default:
      variantStyle = "bg-gray-800 text-white hover:bg-gray-700";
      break;
  }
  if (size === "sm")
    baseStyle =
      "px-2.5 py-1.5 rounded-md text-xs transition shadow-sm flex items-center justify-center gap-1";

  return (
    <motion.button
      className={`${baseStyle} ${variantStyle} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default function AdminMarkAttendance() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("in");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get("/admin/employees");
        if (resp.data?.success) setEmployees(resp.data.data || []);
      } catch (err) {
        setToast({
          message: err.message || "Failed to load employees",
          type: "error",
        });
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId)
      return setToast({ message: "Select employee", type: "error" });
    setLoading(true);
    try {
      let timestamp;
      if (date) {
        if (time) {
          timestamp = new Date(`${date}T${time}`).toISOString();
        } else {
          const now = new Date();
          const d = new Date(date);
          d.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
          );
          timestamp = d.toISOString();
        }
      } else {
        timestamp = new Date().toISOString();
      }

      const resp = await api.post(`/admin/employees/${selectedId}/attendance`, {
        type,
        timestamp,
        note,
      });

      if (resp.data?.success) {
        setToast({ message: "Attendance marked", type: "success" });
        // clear form
        setDate("");
        setTime("");
        setType("in");
        setNote("");
        setSelectedId("");
      } else {
        setToast({
          message: resp.data?.message || "Failed to mark",
          type: "error",
        });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            Admin — Mark Attendance
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3"
          >
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600 block mb-1">
                Employee
              </label>
              <StyledSelect
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">-- Select employee --</option>
                {employees.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </StyledSelect>
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Date</label>
              <StyledInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Time (optional)
              </label>
              <StyledInput
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">Type</label>
              <StyledSelect
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="in">IN</option>
                <option value="out">OUT</option>
              </StyledSelect>
            </div>

            <div className="sm:col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Note (optional)
              </label>
              <textarea
                className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="sm:col-span-4 flex gap-2 justify-end">
              <StyledButton type="submit" variant="success" disabled={loading}>
                <FaCheckCircle /> {loading ? "Marking..." : "Mark Attendance"}
              </StyledButton>
              <StyledButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setDate("");
                  setTime("");
                  setType("in");
                  setNote("");
                  setSelectedId("");
                }}
              >
                <FaTimes /> Reset
              </StyledButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
