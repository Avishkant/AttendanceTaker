import Sidebar from "./SidebarClean";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b h-16 flex items-center px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Smart Attendance</h2>
            <span className="text-sm text-gray-500">— Employee Portal</span>
          </div>
        </header>
        <main className="p-6 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
