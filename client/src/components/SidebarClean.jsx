import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Smart Attendance</h2>
        <div className="text-sm text-gray-500 mt-1">{user?.name}</div>
      </div>
      <nav className="px-3 py-2 flex flex-col gap-1">
        <Link
          to="/employee"
          className="px-3 py-2 rounded hover:bg-gray-50 text-gray-700"
        >
          Dashboard
        </Link>
        <Link
          to="/employee/devices"
          className="px-3 py-2 rounded hover:bg-gray-50 text-gray-700"
        >
          My Devices
        </Link>
        {user?.role === "admin" && (
          <>
            <Link
              to="/admin"
              className="px-3 py-2 rounded hover:bg-gray-50 text-gray-700"
            >
              Admin
            </Link>
            <Link
              to="/admin/employees"
              className="px-3 py-2 rounded hover:bg-gray-50 text-gray-700"
            >
              Manage Employees
            </Link>
          </>
        )}
      </nav>
      <div className="p-6 mt-auto">
        <button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
