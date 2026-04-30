import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePageTitle } from "@/lib/usePageTitle";
import { actionLoader } from "@/lib/actionLoader";

export default function Login() {
  usePageTitle("Sign in");
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user && user.role === "ADMIN") {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    actionLoader.show("Signing in…");
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed. Check your credentials.",
      );
    } finally {
      setSubmitting(false);
      actionLoader.hide();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="bg-decor" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="glass-strong rounded-3xl w-full max-w-md p-8 sm:p-10 relative z-10"
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-primary text-xs font-heading font-semibold tracking-widest uppercase">
            Admin Console
          </p>
        </div>
        <h1 className="font-heading font-bold text-primary-dark text-2xl mt-2">
          Welcome back
        </h1>
        <p className="text-text-secondary text-sm mt-1.5">
          Sign in to manage PropertyLoop.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-7">
          <div>
            <label className="text-xs font-heading font-semibold text-primary-dark mb-1.5 block">
              Email
            </label>
            <div className="relative flex items-center bg-white/60 border border-border-light rounded-2xl focus-within:border-primary focus-within:bg-white transition-colors">
              <Mail className="absolute left-3.5 w-4 h-4 text-text-subtle" />
              <input
                type="email"
                placeholder="admin@propertyloop.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-transparent text-sm text-primary-dark placeholder:text-text-subtle outline-none py-3 pl-10 pr-4"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-heading font-semibold text-primary-dark mb-1.5 block">
              Password
            </label>
            <div className="relative flex items-center bg-white/60 border border-border-light rounded-2xl focus-within:border-primary focus-within:bg-white transition-colors">
              <Lock className="absolute left-3.5 w-4 h-4 text-text-subtle" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-transparent text-sm text-primary-dark placeholder:text-text-subtle outline-none py-3 pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 text-text-subtle hover:text-primary"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2 h-11 rounded-full bg-primary text-white font-heading font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 shadow-lg shadow-primary/30"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>

        <p className="text-text-subtle text-[11px] text-center mt-6">
          This console is restricted to PropertyLoop staff with admin
          privileges.
        </p>
      </motion.div>
    </div>
  );
}
