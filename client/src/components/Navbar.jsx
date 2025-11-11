import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaBell, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const navLinks = (role) => [
  { to: "/employee", label: "Dashboard" },
  { to: "/employee/devices", label: "My Devices" },
  ...(role === "admin"
    ? [
        { to: "/admin", label: "Admin Home" },
        { to: "/admin/employees", label: "Employees" },
        { to: "/admin/requests", label: "Requests" },
      ]
    : []),
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg">
      {/* make the navbar full-bleed: remove max-width container so background spans full width */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3"
              onClick={() =>
                navigate(user?.role === "admin" ? "/admin" : "/employee")
              }
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="bg-white/20 rounded-full p-2"
              >
                <FaUserCircle className="text-2xl text-white" />
              </motion.div>
              <div>
                <div className="font-bold text-lg tracking-tight">
                  Smart Attendance
                </div>
                <div className="text-xs text-indigo-100 opacity-80">
                  Secure, simple clock-in
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks(user?.role).map((n) => (
              <motion.div
                key={n.to}
                whileHover={{ y: -3 }}
                className="relative"
              >
                <Link
                  to={n.to}
                  className="text-sm font-medium text-indigo-50 hover:text-white"
                >
                  {n.label}
                </Link>
                <motion.span
                  layoutId="underline"
                  className="absolute left-0 right-0 -bottom-2 h-0.5 bg-white opacity-0"
                />
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {/* <button className="relative p-2 rounded-full bg-white/10 hover:bg-white/20">
                <FaBell />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs bg-red-500 rounded-full">
                  3
                </span>
              </button> */}
              <div className="text-right">
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs opacity-80">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="ml-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
              >
                Sign out
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setOpen((s) => !s)}
                className="p-2 rounded bg-white/10 hover:bg-white/20"
              >
                {open ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-indigo-600/95"
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              {navLinks(user?.role).map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="block text-white font-medium py-2"
                >
                  {n.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-indigo-500">
                <div className="text-sm text-indigo-100">{user?.name}</div>
                <div className="text-xs text-indigo-200 mb-2">
                  {user?.email}
                </div>
                <button
                  onClick={logout}
                  className="w-full bg-white text-indigo-700 py-2 rounded"
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
