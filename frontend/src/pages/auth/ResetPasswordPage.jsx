import { CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { getDisplayErrorMessage } from "../../utils/errors";
import axios from "axios";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (!token) {
      return toast.error("Reset token is missing from URL");
    }

    setPending(true);

    try {
      await axios.post("/api/auth/reset-password", { 
        token, 
        password: form.password 
      });
      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      toast.error(getDisplayErrorMessage(error, "Failed to reset password. The link might be expired."));
    } finally {
      setPending(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accentDim text-accent">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Password Reset</h1>
        <p className="mt-2 text-sm text-secondary">
          Your password has been successfully updated. Redirecting you to login...
        </p>
        <div className="mt-6">
          <Button as={Link} to="/login" className="w-full justify-center">
            Log in now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Security</p>
      <h1 className="mt-3 font-display text-[2.2rem] font-semibold text-ink">Set new password</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">
        Choose a strong password that you haven't used before.
      </p>

      {!token ? (
        <div className="mt-8 rounded-lg bg-dangerDim p-4 text-sm text-dangerText border border-danger/10">
          Invalid or missing reset token. Please request a new link from the forgot password page.
          <Link to="/forgot-password" className="block mt-2 font-medium underline">Go to Forgot Password</Link>
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Field label="New Password">
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              autoFocus
            />
          </Field>
          <Field label="Confirm New Password">
            <Input
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
            />
          </Field>
          <Button type="submit" className="w-full justify-center font-display uppercase tracking-[0.08em]" icon={ArrowRight} loading={pending}>
            Reset Password
          </Button>
        </form>
      )}
    </div>
  );
}
