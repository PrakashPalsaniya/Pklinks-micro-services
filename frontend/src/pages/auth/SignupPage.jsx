import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { getDisplayErrorMessage } from "../../utils/errors";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      await signup(form);
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

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <Field label="Full name">
          <Input
            placeholder="Pawan Kumar"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          />
        </Field>
        <Field label="Email address">
          <Input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </Field>
        <Field label="Password" description="Use at least 8 characters.">
          <Input
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            minLength={8}
            required
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            minLength={8}
            required
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

