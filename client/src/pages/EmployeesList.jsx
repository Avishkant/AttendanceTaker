import { useEffect, useState } from "react";
import api from "../api";
import Toast from "../components/Toast"; // Assuming this component exists
import { FaUserAlt, FaSearch, FaPlusCircle, FaRedo, FaTrashAlt, FaTimes, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CreateEmployeeCard from "../components/CreateEmployeeCard"; // External component
import { motion, AnimatePresence } from "framer-motion";

// --- Custom Styled Components (White Theme) ---

const StyledInput = ({ className = "", ...props }) => (
    <input
        className={`w-full bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
        {...props}
    />
);

const StyledButton = ({ variant = 'primary', className = '', children, ...props }) => {
    let baseStyle = "px-4 py-2 rounded-lg text-sm transition shadow-md flex items-center justify-center gap-2";
    let variantStyle = "";

    switch (variant) {
        case 'success': variantStyle = "bg-green-600 text-white hover:bg-green-700"; break;
        case 'primary': variantStyle = "bg-indigo-600 text-white hover:bg-indigo-700"; break;
        case 'secondary': variantStyle = "bg-gray-200 text-gray-800 hover:bg-gray-300"; break;
        case 'danger': variantStyle = "bg-red-600 text-white hover:bg-red-700"; break;
        default: variantStyle = "bg-gray-800 text-white hover:bg-gray-700"; break;
    }
    
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

export default function EmployeesList() {
    const [employees, setEmployees] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const resp = await api.get("/admin/employees");
            if (resp.data?.success) {
                setEmployees(resp.data.data || []);
                setAllEmployees(resp.data.data || []);
            } else setEmployees([]);
        } catch (err) {
            console.error(err);
            setToast({
                message: err.response?.data?.message || err.message,
                type: "error",
            });
        }
    };

    const searchEmployees = async (term) => {
        const q = ((term ?? search) || "").trim();
        if (!q) {
            setEmployees(allEmployees);
            return;
        }
        setSearching(true);
        try {
            // Priority: Server-side search if implemented, otherwise client-side filter
            const resp = await api.get("/admin/employees", { params: { q } });
            const source = resp.data?.data || allEmployees || [];
            const filtered = source.filter(
                (u) =>
                    (u.name || "").toLowerCase().includes(q.toLowerCase()) ||
                    (u.email || "").toLowerCase().includes(q.toLowerCase())
            );
            setEmployees(filtered);
        } catch (err) {
            console.error(err);
            // Fallback to client-side filter on error
            const filtered = allEmployees.filter(
                (u) =>
                    (u.name || "").toLowerCase().includes(q.toLowerCase()) ||
                    (u.email || "").toLowerCase().includes(q.toLowerCase())
            );
            setEmployees(filtered);
        } finally {
            setSearching(false);
        }
    };

    const handleCreateSuccess = (newEmployee) => {
        setEmployees((s) => [newEmployee, ...s]);
        setAllEmployees((s) => [newEmployee, ...s]);
        setShowCreate(false);
        setToast({ message: "Employee created successfully!", type: "success" });
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            
            <div className="max-w-4xl mx-auto">
                
                <motion.div 
                    className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header and Top Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                        <h1 className="text-2xl font-extrabold flex items-center gap-2">
                            <FaUsers className="text-gray-600" /> Employee List
                        </h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <StyledButton
                                onClick={() => setShowCreate(true)}
                                variant="success"
                                className="font-semibold"
                            >
                                <FaPlusCircle /> Create Employee
                            </StyledButton>
                            <StyledButton
                                onClick={() => navigate("/admin/employees/manage")}
                                variant="primary"
                                className="font-semibold"
                            >
                                Open Management View
                            </StyledButton>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4 mb-6 pt-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <StyledInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") searchEmployees();
                                }}
                                placeholder="Search by name or email..."
                                className="flex-1 w-full"
                            />
                            <StyledButton
                                onClick={() => searchEmployees()}
                                disabled={searching}
                                variant="primary"
                            >
                                {searching ? "Searching..." : <FaSearch />}
                            </StyledButton>
                            <StyledButton
                                onClick={() => {
                                    setSearch("");
                                    setEmployees(allEmployees);
                                }}
                                variant="secondary"
                            >
                                <FaRedo /> Clear
                            </StyledButton>
                            <StyledButton
                                onClick={fetchEmployees}
                                variant="ghost"
                            >
                                <FaRedo /> Reload List
                            </StyledButton>
                        </div>
                    </div>

                    {/* Employee List Display */}
                    {employees.length === 0 ? (
                        <p className="text-gray-500 py-4 text-center">
                            {searching ? "No results found." : "No employees found."}
                        </p>
                    ) : (
                        <motion.ul 
                            className="divide-y divide-gray-200 border-t border-gray-200"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {employees.map((u, index) => (
                                <motion.li
                                    key={u._id}
                                    className="py-3 flex justify-between items-center hover:bg-gray-50 transition duration-150 rounded-md -mx-3 px-3"
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">{u.name}</div>
                                        <div className="text-sm text-gray-600">{u.email}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-sm font-medium ${u.role === 'admin' ? 'text-indigo-600' : 'text-gray-600'}`}>{u.role}</div>
                                        <StyledButton
                                            onClick={() =>
                                                navigate(`/admin/employees/manage?id=${u._id}`, {
                                                    state: { selectId: u._id },
                                                })
                                            }
                                            variant="primary"
                                            size="sm"
                                        >
                                            Manage
                                        </StyledButton>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </motion.div>
                
                {/* --- Create Employee Modal --- */}
                <AnimatePresence>
                    {showCreate && (
                        <motion.div 
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="w-full max-w-md">
                                <CreateEmployeeCard
                                    onClose={() => setShowCreate(false)}
                                    onCreated={handleCreateSuccess}
                                    // Assuming CreateEmployeeCard is styled to match the light theme
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}