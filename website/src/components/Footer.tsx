import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { portalLinks, school } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="no-print border-t border-forest-800 bg-forest-950 text-forest-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt=""
              className="size-9 shrink-0 rounded-full"
              width={36}
              height={36}
              aria-hidden
            />
            <div>
              <p className="text-sm font-bold text-white">{school.shortName}</p>
              <p className="font-arabic text-xs text-forest-300">{school.nameArabic}</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-forest-200/80">
            {school.description}
          </p>
          <p className="mt-4 font-arabic text-lg text-gold-400">{school.mottoArabic}</p>
          <p className="text-xs uppercase tracking-widest text-forest-300">{school.motto}</p>
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-400">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(
              [
                ["/", "Home"],
                ["/about", "About the madrasa"],
                ["/academics", "Academics"],
                ["/admissions", "Admissions"],
                ["/news", "News & events"],
                ["/application-status", "Check application status"],
              ] as const
            ).map(([path, label]) => (
              <li key={path}>
                <Link to={path} className="transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-400">Contact</p>
          <ul className="mt-3 space-y-3 text-sm text-forest-100/90">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
              <span>{school.contact.address}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
              <a href={`tel:${school.contact.phone.replace(/-/g, "")}`} className="hover:text-white">
                {school.contact.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
              <a href={`mailto:${school.contact.email}`} className="hover:text-white">
                {school.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
              <span>{school.contact.officeHours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-forest-900 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[11px] text-forest-300/80">
          <p>
            © {year} {school.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-3">
            <a href={portalLinks.portal} className="hover:text-white">
              Student portal
            </a>
            <a href={portalLinks.portalParent} className="hover:text-white">
              Parent portal
            </a>
            <a href={portalLinks.admin} className="hover:text-white">
              Administration
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
