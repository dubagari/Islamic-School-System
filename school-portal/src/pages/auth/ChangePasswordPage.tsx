import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectCurrentUser, updatePasswordFlags } from "@/features/auth/authSlice";
import { useChangePasswordMutation } from "@/app/api";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Fields";
import { Alert } from "@/components/ui/Alert";

export function ChangePasswordPage() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const forceChange = user?.mustChangePassword ?? false;

  const strength = passwordStrength(newPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: "Use at least 8 characters." });
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      dispatch(updatePasswordFlags(false));
      navigate("/", { replace: true });
    } catch (err) {
      const payload = err as {
        data?: { message?: string; errors?: { field: string; message: string }[] };
      };
      setError(payload.data?.message);
      const errs = payload.data?.errors;
      if (errs) {
        setFieldErrors(
          Object.fromEntries(errs.map((e) => [e.field, e.message])),
        );
      }
    }
  };

  const passwordFields = (
    <>
      <InputField
        label="Current password"
        required
        type={show ? "text" : "password"}
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={fieldErrors.currentPassword}
      />
      <div className="relative">
        <InputField
          label="New password"
          required
          hint="At least 8 characters. Mix letters, numbers and symbols."
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.newPassword}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-8 end-2 rounded p-1 text-ink-400 hover:text-ink-700"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      <div aria-hidden className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              strength >= level
                ? strength >= 3
                  ? "bg-primary-500"
                  : "bg-gold-400"
                : "bg-ink-100"
            }`}
          />
        ))}
      </div>
      <p className="-mt-1 text-xs text-ink-500">{strengthLabel(strength)}</p>
      <InputField
        label="Confirm new password"
        required
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
      />
    </>
  );

  return (
    <main
      className={
        forceChange
          ? "flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10"
          : "mx-auto max-w-lg px-4 py-10"
      }
    >
      <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
        {forceChange && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-gold-300 bg-gold-50 p-3 text-gold-900">
            <ShieldAlert className="size-5 shrink-0" aria-hidden />
            <p className="text-xs leading-relaxed">
              For security you must choose a new password before you can use
              Darul Ulum. Your current password was set by the office.
            </p>
          </div>
        )}

        <h1 className="text-lg font-bold text-ink-900">Change your password</h1>
        <p className="mt-1 text-sm text-ink-500">
          Passwords are at least 8 characters long.
        </p>

        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}

        <form
          className="mt-5 space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {passwordFields}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
            disabled={forceChange && (newPassword.length < 8 || newPassword !== confirmPassword)}
          >
            Save new password
          </Button>
        </form>
      </div>
    </main>
  );
}

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length >= 12) score += 1;
  return score;
}

function strengthLabel(score: number): string {
  if (!score) return "";
  if (score <= 1) return "Weak password";
  if (score === 2) return "Reasonable password";
  if (score === 3) return "Strong password";
  return "Very strong password";
}
