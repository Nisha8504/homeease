import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";
import { UserRole } from "../backend.d";
import { useAppContext } from "../context/AppContext";

export default function Navbar() {
  const { user, logout } = useAppContext();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    // Clear session state first, then force a full page reload.
    // This ensures a fresh anonymous ICP principal is issued for the next
    // login session, preventing principal key collisions between accounts.
    logout();
    setOpen(false);
    // Use href redirect instead of navigate() to force a full page reload
    // so the ICP actor is re-initialized with a brand-new anonymous principal.
    window.location.href = "/";
  };

  const navLinks = () => {
    if (!user) {
      return [
        { label: "Home", to: "/" as const, ocid: "nav.home.link" },
        { label: "Login", to: "/login" as const, ocid: "nav.login.link" },
      ];
    }
    if (user.role === UserRole.customer) {
      return [
        { label: "Home", to: "/" as const, ocid: "nav.home.link" },
        {
          label: "My Bookings",
          to: "/my-bookings" as const,
          ocid: "nav.bookings.link",
        },
      ];
    }
    if (user.role === UserRole.provider) {
      return [
        { label: "Home", to: "/" as const, ocid: "nav.home.link" },
        {
          label: "Dashboard",
          to: "/provider/dashboard" as const,
          ocid: "nav.dashboard.link",
        },
      ];
    }
    if (user.role === UserRole.admin) {
      return [
        {
          label: "Admin Dashboard",
          to: "/admin/dashboard" as const,
          ocid: "nav.admin.link",
        },
      ];
    }
    return [] as { label: string; to: string; ocid: string }[];
  };

  const links = navLinks();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-ocid="nav.home.link"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-[700] tracking-tight text-foreground">
            Home<span className="text-primary">Ease</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to as any}
              data-ocid={link.ocid}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-ocid="nav.logout.button"
              >
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          data-ocid="nav.menu.button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to as any}
              data-ocid={link.ocid}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className={cn("pt-2 border-t border-border mt-2")}>
              <p className="px-3 py-1 text-xs text-muted-foreground">
                {user.email}
              </p>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                onClick={handleLogout}
                data-ocid="nav.logout.button"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
