import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { useLoginMutation } from "@/app/api";
import { Button } from "@/components/ui/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await login({
        identifier: identifier.trim(),
        password,
      }).unwrap();

      navigate(
        result.data?.user?.mustChangePassword ? "/change-password" : "/",
        { replace: true },
      );
    } catch (err) {
      const payload = err as { data?: { message?: string } };
      setError(
        payload.data?.message ?? "Login failed. Check your details and try again.",
      );
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-forest-900 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt=""
            className="mx-auto mb-4 size-14 rounded-full shadow-card"
            width={56}
            height={56}
            aria-hidden
          />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Darul Ulum
          </h1>
          <p className="mt-1 font-arabic text-[15px] leading-relaxed text-primary-300">
            دار العلوم
          </p>
          <h2 className="mt-2 text-xs font-medium uppercase tracking-widest text-forest-300">
            Management System
          </h2>
        </div>

        <form
          // Panel
          onSubmit={handleSubmit}
          className="rounded-card border border-forest-800 bg-forest-950/90 p-6 shadow-pop motion-safe:animate-fade-in"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-forest-100">
                Application Number 
              </span>
              <input
                type="text"
                name="identifier"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg border border-forest-700 bg-forest-800 px-3 py-2 text-sm text-white placeholder:text-forest-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                placeholder="e.g. app-4853-2024"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-forest-100">
                Password
              </span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-forest-700 bg-forest-800 px-3 py-2 pe-10 text-sm text-white placeholder:text-forest-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-forest-300 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-forest-400">
          Access is provided by the school administration.
          <br />
          Contact your office if you cannot sign in.
        </p>
      </div>
    </main>
  );
}
