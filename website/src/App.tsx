import { lazy, Suspense, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";

import NotFoundPage from "@/pages/NotFoundPage";
import { PageLoader } from "@/components/PageLoader";

function lazyNamed(loader: () => Promise<Record<string, unknown>>, name: string) {
  return lazy(() => loader().then((m) => ({ default: m[name] as ComponentType })));
}

const HomePage = lazyNamed(() => import("@/pages/HomePage"), "HomePage");
const AboutPage = lazyNamed(() => import("@/pages/AboutPage"), "AboutPage");
const AcademicsPage = lazyNamed(() => import("@/pages/AcademicsPage"), "AcademicsPage");
const AdmissionsPage = lazyNamed(() => import("@/pages/AdmissionsPage"), "AdmissionsPage");
const ApplyPage = lazyNamed(() => import("@/pages/ApplyPage"), "ApplyPage");
const ApplicationStatusPage = lazyNamed(
  () => import("@/pages/ApplicationStatusPage"),
  "ApplicationStatusPage",
);
const NewsPage = lazyNamed(() => import("@/pages/NewsPage"), "NewsPage");
const ContactPage = lazyNamed(() => import("@/pages/ContactPage"), "ContactPage");

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/academics" element={<AcademicsPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/application-status" element={<ApplicationStatusPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
