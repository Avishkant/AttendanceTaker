import { useEffect, useState } from "react";
import api from "../api";
import Toast from "../components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaTimes, FaClock, FaCalendarAlt, FaUserAlt } from "react-icons/fa";

// --- Custom Styled Components (White Theme) ---

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

// --- Main Component ---

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
        // If date is set, construct timestamp from date and time, defaulting time to NOW
        if (time) {
          timestamp = new Date(`${date}T${time}`).toISOString();
        } else {
          // If only date is set, merge with current time
          const now = new Date();
          const [y, m, d] = date.split('-').map(Number);
          const customDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          timestamp = customDate.toISOString();
        }
      } else {
        // If no date/time is set, use current moment
        timestamp = new Date().toISOString();
      }

      const resp = await api.post(`/admin/employees/${selectedId}/attendance`, {
        type,
        timestamp,
        note,
      });

      if (resp.data?.success) {
        setToast({ message: "Attendance marked", type: "success" });
        // clear form only if successful
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

      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
            <FaClock className="text-gray-600" /> Admin — Mark Attendance
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            {/* Row 1: Employee Selection */}
            <div className="sm:col-span-4">
              <label className="text-sm text-gray-600 block mb-1 font-medium">
                Select Employee
              </label>
              <StyledSelect
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                <option value="">-- Select employee --</option>
                {employees.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </StyledSelect>
            </div>

            {/* Row 2: Date, Time, and Type */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="text-sm text-gray-600 block mb-1 font-medium">
                  Date
                </label>
                <StyledInput
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-sm text-gray-600 block mb-1 font-medium">
                  Time (Optional)
                </label>
                <StyledInput
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-sm text-gray-600 block mb-1 font-medium">
                  Type
                </label>
                <StyledSelect
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="in">IN</option>
                  <option value="out">OUT</option>
                </StyledSelect>
              </div>
            </div>

            {/* Row 3: Note */}
            <div className="sm:col-span-4 mt-2">
              <label className="text-sm text-gray-600 block mb-1 font-medium">
                Note (Optional)
              </label>
              <textarea
                className="w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Row 4: Submit Buttons */}
            <div className="sm:col-span-4 flex gap-3 justify-end pt-4 border-t border-gray-100">
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
                <FaTimes /> Reset Form
              </StyledButton>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}