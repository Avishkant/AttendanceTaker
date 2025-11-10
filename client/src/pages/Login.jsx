import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import { FaSignInAlt, FaClock } from "react-icons/fa";

// --- Custom Styled Input Component (Light Theme) ---
const StyledInput = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-300 ${className}`}
    {...props}
  />
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = "info") => setToast({ message, type });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const role = res.user.role;
        showToast("Login successful!", "success");
        // Use a short delay to ensure context updates before navigating
        setTimeout(() => {
          if (role === "admin") navigate("/admin", { replace: true });
          else navigate("/employee", { replace: true });
        }, 50);
      } else {
        const errorMsg = res.message || "Invalid credentials.";
        showToast(errorMsg, "error");
      }
    } catch (err) {
      showToast(err.message || "Network error. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      
      {/* Login Card Container with Motion */}
      <motion.form
        onSubmit={submit}
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <header className="text-center mb-6">
            <FaClock className="w-10 h-10 mx-auto mb-2 text-gray-600" />
            <h2 className="text-3xl font-extrabold text-gray-800">Smart Attendance</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your dashboard</p>
        </header>

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
            <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <StyledInput
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                />
            </label>
            <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <StyledInput
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />
            </label>
        </div>
        
        {/* Submit Button */}
        <motion.div 
            className="mt-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-lg font-bold transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                disabled={loading}
            >
                <FaSignInAlt /> {loading ? "Signing In..." : "Sign In"}
            </button>
        </motion.div>
        
      </motion.form>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}