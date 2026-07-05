import { CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { getDisplayErrorMessage } from "../../utils/errors";
import axios from "axios";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  const onSubmit = async (data) => {
    if (!token) {
      return toast.error("Reset token is missing from URL");
    }

    setPending(true);

    try {
      await axios.post("/api/auth/reset-password", { 
        token, 
        password: data.password 
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
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="New Password" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              {...register("password")}
              disabled={pending}
              autoFocus
            />
          </Field>
          <Field label="Confirm New Password" error={errors.confirmPassword?.message}>
            <Input
              type="password"
              placeholder="Repeat password"
              {...register("confirmPassword")}
              disabled={pending}
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
