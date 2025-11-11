import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  FaTachometerAlt,
  FaLaptop,
  FaUserShield,
  FaSignOutAlt,
  FaClock,
} from "react-icons/fa";

// --- Reusable Navigation Item Component ---
const SidebarLink = ({ to, icon: Icon, children, isExternal = false }) => (
  <motion.div
    className="group"
    whileHover={{ x: 5 }} // Subtle horizontal slide on hover
  >
    <Link
      to={to}
      className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition duration-200 flex items-center gap-3"
      target={isExternal ? "_blank" : "_self"}
    >
      <Icon className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700 transition" />
      <span className="font-medium">{children}</span>
    </Link>
  </motion.div>
);

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    // Use a clean, fixed-width white container with a subtle shadow
    // Hidden on small screens (Navbar provides mobile navigation)
    <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-gray-200 shadow-lg flex-col">
      {/* --- Logo and User Info Header --- */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaClock className="text-gray-600" /> Smart Attendance
        </h2>
        <div className="text-sm text-gray-500 mt-2">
          Logged in as:{" "}
          <span className="font-semibold text-gray-700">{user?.name}</span>
        </div>
      </div>

      {/* --- Navigation Links --- */}
      <nav className="px-4 py-4 flex flex-col gap-2 flex-grow">
        {/* Employee Links */}
        <SidebarLink to="/employee" icon={FaTachometerAlt}>
          Dashboard
        </SidebarLink>
        <SidebarLink to="/employee/devices" icon={FaLaptop}>
          My Devices
        </SidebarLink>

        {/* Admin Link (Conditional) */}
        {user?.role === "admin" && (
          <motion.div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">
              Admin Tools
            </h3>
            <SidebarLink to="/admin" icon={FaUserShield}>
              Admin Panel
            </SidebarLink>
          </motion.div>
        )}
      </nav>

      {/* --- Logout Button --- */}
      <motion.div
        className="p-6 border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={logout}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 py-2.5 rounded-lg text-sm font-bold transition shadow-md flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaSignOutAlt /> Logout
        </motion.button>
      </motion.div>
    </aside>
  );
}
