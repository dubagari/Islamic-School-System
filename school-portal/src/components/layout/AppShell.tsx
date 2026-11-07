import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, DoorOpen, Menu, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useLogoutMutation, useSelfProfileQuery } from "@/app/api";
import { selectCurrentUser, setUser } from "@/features/auth/authSlice";
import { isActivePath, navForRole } from "./nav";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();
  const { data: profile } = useSelfProfileQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: 120,
  });

  // Keep stale role flags fresh (e.g. mustChangePassword cleared elsewhere)
  useEffect(() => {
    const fresh = profile?.data;
    if (!fresh) return;
    const changed =
      fresh.mustChangePassword !== user?.mustChangePassword ||
      fresh.fullName !== user?.fullName ||
      fresh.isActive !== user?.isActive;
    if (changed) {
      dispatch(setUser(fresh));
    }
  }, [profile, dispatch, user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const role = user?.role;
  const nav = navForRole(role);
  const groups = nav;

  const sidebar = (
    <div className="flex h-full flex-col bg-forest-900 text-white">
      {/* Branding */}
      <Link
        to="/"
        className="flex items-center gap-3 border-b border-forest-800 px-4 py-4"
        aria-label="Darul Ulum home"
      >
        <img
          src="/logo.png"
          alt=""
          className="size-9 shrink-0 rounded-full"
          width={36}
          height={36}
          aria-hidden
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-wide text-white">
            Darul Ulum
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-widest text-forest-300">
            School Portal
          </span>
        </span>
      </Link>

      {/* Navigation */}
      <nav
        aria-label="Primary"
        className="flex-1 space-y-4 overflow-y-auto px-2.5 py-4"
      >
        {groups.map((group) => (
          <div key={group.label ?? group.items[0]?.path}>
            {group.label && (
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-forest-400">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(location.pathname, item.path);
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-primary-700 text-white shadow-sm"
                          : "text-forest-100/80 hover:bg-forest-800 hover:text-white",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User / logout */}
      <div className="border-t border-forest-800 p-3">
        <Link
          to="/profile"
          className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-forest-800"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-600/20 text-xs font-bold text-gold-300">
            {initials(user?.fullName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-white">
              {user?.fullName ?? "—"}
            </span>
            <span className="block truncate text-[11px] capitalize text-forest-300">
              {user?.username} · {role}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-forest-100/80 transition-colors hover:bg-forest-800 hover:text-white"
        >
          <DoorOpen className="size-4 shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );

  const doLogout = async () => {
    setLogoutOpen(false);
    await logoutMutation();
    navigate("/login");
  };

  return (
    <div className="flex h-svh bg-forest-50">
      {/* Skip link */}
      <a
        href="#main-content"
        className="no-print sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900 focus:shadow-pop"
      >
        Skip to main content
      </a>
      {/* Desktop sidebar */}
      <aside
        className="no-print hidden w-64 shrink-0 overflow-y-auto lg:block"
        aria-label="Sidebar"
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-forest-950/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-pop">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute end-2 top-2 z-10 rounded-md p-1.5 text-forest-100/80 hover:bg-forest-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="size-4" aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-ink-600 hover:bg-forest-50 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">
              {pageTitleFromPath(location.pathname)}
            </p>
          </div>

          {profile?.data?.mustChangePassword && (
            <Link to="/change-password" className="hidden sm:block">
              <Badge tone="warning" icon={<AlertTriangle className="size-3" aria-hidden />}>
                Password change required
              </Badge>
            </Link>
          )}

          <Link
            to="/notifications"
            className="relative rounded-md p-2 text-ink-600 transition-colors hover:bg-forest-50"
            aria-label="Notifications"
          >
            <Bell className="size-5" aria-hidden />
            <NotificationsDot />
          </Link>

          <Link
            to="/profile"
            className="flex size-8 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white"
            aria-label="Your profile"
          >
            {initials(user?.fullName)}
          </Link>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={doLogout}
        title="Sign out?"
        description="You will return to the login screen."
        confirmLabel="Sign out"
      />
    </div>
  );
}

function initials(name: string | undefined) {
  if (!name) return "DU";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function pageTitleFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) return "Dashboard";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const unreadDot =
  /* wired through the notifications API once the page is registered */
  false;

function NotificationsDot() {
  if (!unreadDot) return null;
  return (
    <span className="absolute inset-0 flex items-start justify-end p-1.5">
      <span className="size-2 rounded-full bg-gold-500 ring-2 ring-white" aria-hidden />
    </span>
  );
}
