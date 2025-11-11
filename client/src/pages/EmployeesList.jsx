import { useEffect, useState } from "react";
import api from "../api";
import Toast from "../components/Toast";
import { FaUserAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CreateEmployeeCard from "../components/CreateEmployeeCard";

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const resp = await api.get("/admin/employees");
      if (resp.data?.success) setEmployees(resp.data.data || []);
      else setEmployees([]);
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FaUserAlt className="text-gray-600" /> Employees
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
              >
                Create Employee
              </button>
              <button
                onClick={() => navigate("/admin/employees/manage")}
                className="text-sm text-indigo-600 hover:underline"
              >
                Open management
              </button>
            </div>
          </div>

          {employees.length === 0 ? (
            <p className="text-gray-500">No employees found.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {employees.map((u) => (
                <li
                  key={u._id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">{u.role}</div>
                    <button
                      onClick={() =>
                        navigate(`/admin/employees/manage?id=${u._id}`, {
                          state: { selectId: u._id },
                        })
                      }
                      className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded"
                    >
                      Manage
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {/* Create modal/card */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md">
                <CreateEmployeeCard
                  onClose={() => setShowCreate(false)}
                  onCreated={(d) => {
                    setEmployees((s) => [d, ...s]);
                    setShowCreate(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
