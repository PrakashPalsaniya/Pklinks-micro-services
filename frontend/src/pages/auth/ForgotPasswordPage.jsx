import { ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { getDisplayErrorMessage } from "../../utils/errors";
import axios from "axios";

export function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPending(true);

    try {
      // Direct axios call as it's a public route and might not be in AuthContext
      await axios.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Reset link sent successfully.");
    } catch (error) {
      toast.error(getDisplayErrorMessage(error, "Failed to send reset link."));
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Success</p>
        <h1 className="mt-3 font-display text-[2.2rem] font-semibold text-ink">Check your email</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          We've sent a password reset link to <span className="font-medium text-ink">{email}</span>. 
          Please check your inbox and follow the instructions.
        </p>
        <div className="mt-8">
          <Button as={Link} to="/login" className="w-full justify-center font-display uppercase tracking-[0.08em]" icon={ArrowLeft}>
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Recovery</p>
      <h1 className="mt-3 font-display text-[2.2rem] font-semibold text-ink">Forgot password?</h1>
      <p className="mt-3 text-sm leading-6 text-secondary">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <Field label="Email address">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
          />
        </Field>
        <Button type="submit" className="w-full justify-center font-display uppercase tracking-[0.08em]" icon={ArrowRight} loading={pending}>
          Send Reset Link
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-center text-sm text-secondary">
        <Link className="flex items-center gap-2 text-accent hover:text-accentHover" to="/login">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </div>
    </div>
  );
}
