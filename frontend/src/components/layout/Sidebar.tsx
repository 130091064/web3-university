import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/swap", label: "Swap" },
  { to: "/vault", label: "Vault" },
  { to: "/me", label: "Me" },
];

const Sidebar = () => {
  return (
    <aside className="w-48 border-r border-slate-200 p-4">
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="text-slate-700">
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
