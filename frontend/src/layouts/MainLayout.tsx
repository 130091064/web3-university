import { NavLink, Outlet } from "react-router-dom";
import { navItems } from "../navigation/navItems";
import Header from "@components/layout/Header";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Header />

      <div className="flex flex-1">
        {/* 左侧 Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white p-4">
          <nav className="flex flex-col gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 transition ${
                    isActive
                      ? "bg-indigo-500 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* 右侧 Main */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
