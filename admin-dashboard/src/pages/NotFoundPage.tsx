import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-arabic text-4xl text-primary-200" aria-hidden>
        ﺐﺴﻛ
      </p>
      <div>
        <h1 className="text-xl font-bold text-ink-900">Page not found</h1>
        <p className="mt-1 text-sm text-ink-500">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  );
}
