import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { school } from "@/content/site";

export function ContactPage() {
  const { contact } = school;
  return (
    <PageShell>
      <PageHero eyebrow="Contact" title="Reach the madrasa" arabic="اتصل بنا" />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="We're glad to help"
          title="Questions about admissions, fees, or a visit?"
          description="The front office answers during working hours — or send us a WhatsApp message any time."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <a
            href={`tel:${contact.phone.replace(/-/g, "")}`}
            className="group flex items-start gap-4 rounded-card border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
              <Phone className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Phone</p>
              <p className="mt-1 text-sm font-semibold text-ink-900 group-hover:text-primary-800">{contact.phone}</p>
              <p className="mt-0.5 text-xs text-ink-500">{contact.officeHours}</p>
            </div>
          </a>

          <a
            href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-4 rounded-card border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">WhatsApp</p>
              <p className="mt-1 text-sm font-semibold text-ink-900 group-hover:text-primary-800">{contact.whatsapp}</p>
              <p className="mt-0.5 text-xs text-ink-500">Replies within a day, in sha Allah</p>
            </div>
          </a>

          <a
            href={`mailto:${contact.email}`}
            className="group flex items-start gap-4 rounded-card border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
              <Mail className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Email</p>
              <p className="mt-1 break-all text-sm font-semibold text-ink-900 group-hover:text-primary-800">{contact.email}</p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-card border border-ink-100 bg-white p-6 shadow-card">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
              <MapPin className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Address</p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{contact.address}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                <Clock className="size-3" aria-hidden />
                {contact.officeHours}
              </p>
            </div>
          </div>
        </div>

        <article className="mt-10 rounded-card border border-ink-100 bg-forest-50/60 p-6 sm:p-8">
          <h2 className="text-base font-bold text-ink-900">Visiting the campus</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">{contact.mapNote}</p>
          <p className="mt-4 text-xs text-ink-500">
            Prefer writing? Email is the fastest for records requests — call for anything urgent.
          </p>
        </article>
      </section>
    </PageShell>
  );
}
