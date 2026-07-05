import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { getDisplayErrorMessage } from "../../utils/errors";

const signupSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" }
  });

  const onSubmit = async (data) => {
    setPending(true);
    try {
      await signup({ 
        email: data.email, 
        password: data.password, 
        displayName: data.fullName 
      });
      toast.success("Account created.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getDisplayErrorMessage(error, "We couldn't create your account right now."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Signup</p>
      <h1 className="mt-3 font-display text-[2.2rem] font-semibold text-ink">Create your account</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">
        Open a new workspace with your email address.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Full name" error={errors.fullName?.message}>
          <Input
            placeholder="Pawan Kumar"
            {...register("fullName")}
            disabled={pending}
          />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={pending}
          />
        </Field>
        <Field label="Password" description="Use at least 8 characters." error={errors.password?.message}>
          <Input
            type="password"
            placeholder="Create a password"
            {...register("password")}
            disabled={pending}
          />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <Input
            type="password"
            placeholder="Repeat your password"
            {...register("confirmPassword")}
            disabled={pending}
          />
        </Field>
        <Button type="submit" className="w-full justify-center font-display uppercase tracking-[0.08em]" icon={ArrowRight} loading={pending}>
          Create account
        </Button>
      </form>

      <p className="mt-5 text-sm text-secondary">
        Already have an account?{" "}
        <Link className="text-accent hover:text-accentHover" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}

