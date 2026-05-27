import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { getDisplayErrorMessage } from "../../utils/errors";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    const authError = searchParams.get("authError");

    if (!authError) {
      return;
    }

    toast.error(authError);
    searchParams.delete("authError");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPending(true);

    try {
      await login(form);
      toast.success("Welcome back.");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getDisplayErrorMessage(error, "We couldn't sign you in right now."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Login</p>
      <h1 className="mt-3 font-display text-[2.2rem] font-semibold text-ink">Welcome back</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">
        Sign in to your account with your email and password.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <Field label="Email address">
          <Input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </Field>
        <Button type="submit" className="w-full justify-center font-display uppercase tracking-[0.08em]" icon={ArrowRight} loading={pending}>
          Sign in
        </Button>
      </form>

      <div className="mt-5 flex flex-col gap-2 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-accent hover:text-accentHover" to="/forgot-password">
          Forgot password?
        </Link>
        <p>
          New here?{" "}
          <Link className="text-accent hover:text-accentHover" to="/signup">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

