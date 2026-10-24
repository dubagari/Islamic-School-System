import { useEffect, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function PageShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  return (
    <div className="flex min-h-svh flex-col bg-forest-50">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  arabic,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  arabic?: string;
  description?: string;
  align?: "center" | "start";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-700">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      {arabic && (
        <p className="mt-1 font-arabic text-xl leading-relaxed text-gold-700" dir="rtl">
          {arabic}
        </p>
      )}
      {description && <p className="mt-3 text-sm leading-relaxed text-ink-500">{description}</p>}
    </div>
  );
}
