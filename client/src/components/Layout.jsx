import Sidebar from "./SidebarClean";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        {/* Ensure main can scroll vertically inside flex layout on small/large screens */}
        <main className="flex-1 p-6 overflow-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
