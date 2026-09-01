import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <Sidebar />

      <div className="ml-64">
        <Navbar />

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}