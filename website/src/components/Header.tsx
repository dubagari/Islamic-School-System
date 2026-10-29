import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";

import { portalLinks, school } from "@/content/site";
import { cn } from "@/lib/cn";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Academics", path: "/academics" },
  { label: "Admissions", path: "/admissions" },
  { label: "News", path: "/news" },
  { label: "Contact", path: "/contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-forest-900/10 bg-forest-950/95 text-white backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900 focus:shadow-pop"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label={`${school.name} — home`}>
          <img
            src="/logo.png"
            alt=""
            className="size-9 shrink-0 rounded-full"
            width={36}
            height={36}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-wide">{school.shortName}</span>
            <span className="block font-arabic text-[10px] leading-none text-forest-300">
              {school.nameArabic}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ms-auto hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              aria-current={
                location.pathname === link.path ||
                (link.path !== "/" && location.pathname.startsWith(link.path))
                  ? "page"
                  : undefined
              }
              className={cn(
                "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors hover:bg-forest-800",
                (location.pathname === link.path ||
                  (link.path !== "/" && location.pathname.startsWith(link.path))) &&
                  "bg-forest-800 text-white",
              )}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto hidden lg:block lg:ms-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLoginOpen((v) => !v)}
              aria-expanded={loginOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1 rounded-lg border border-forest-700 px-3 py-2 text-[13px] font-medium transition-colors hover:border-gold-500/40 hover:bg-forest-900"
            >
              Portal Login
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
            {loginOpen && (
              <div
                role="menu"
                className="absolute end-0 top-full mt-2 w-52 rounded-card border border-ink-100 bg-white p-1.5 shadow-pop"
                onMouseLeave={() => setLoginOpen(false)}
              >
                {(
                  [
                    ["Student portal", portalLinks.portal],
                    // ["Teacher portal", portalLinks.portalTeacher],
                    // ["Parent portal", portalLinks.portalParent],
                    // ["Administration", portalLinks.admin],
                  ] as const
                ).map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    role="menuitem"
                    onClick={() => setLoginOpen(false)}
                    className="block rounded-lg px-3 py-2 text-[13px] text-ink-800 hover:bg-forest-50 hover:text-ink-900"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link
          to="/apply"
          className="hidden rounded-lg bg-gold-500 px-4 py-2 text-[13px] font-bold text-ink-950 shadow-sm transition-colors hover:bg-gold-400 lg:block"
        >
          Apply Now
        </Link>

        <button
          type="button"
          className="ms-auto rounded-md p-2 text-forest-100 hover:bg-forest-800 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile" className="border-t border-forest-800 bg-forest-950 px-4 pb-4 pt-2 lg:hidden">
          <ul className="space-y-0.5">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium text-forest-100/90 hover:bg-forest-800 hover:text-white",
                    (location.pathname === link.path ||
                      (link.path !== "/" && location.pathname.startsWith(link.path))) &&
                      "bg-forest-800 text-white",
                  )}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2">
            <Link
              to="/apply"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-gold-500 px-4 py-2.5 text-center text-sm font-bold text-ink-950"
            >
              Apply Now
            </Link>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <a href={portalLinks.portal} className="rounded-lg border border-forest-700 px-3 py-2 text-center text-forest-100">
                Student portal
              </a>
              {/* <a href={portalLinks.portalParent} className="rounded-lg border border-forest-700 px-3 py-2 text-center text-forest-100">
                Parent portal
              </a> */}
              <a href={portalLinks.portalTeacher} className="rounded-lg border border-forest-700 px-3 py-2 text-center text-forest-100">
                Teacher portal
              </a>
              <a href={portalLinks.admin} className="rounded-lg border border-forest-700 px-3 py-2 text-center text-forest-100">
                Administration
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
