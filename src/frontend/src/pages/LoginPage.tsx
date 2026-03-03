import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { hashPassword } from "../lib/crypto";

export default function LoginPage() {
  const { actor, isFetching } = useActor();
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("Please wait, connecting to server...");
      return;
    }
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(password);
      const [role, name] = await actor.loginWithCredentials(
        email.trim().toLowerCase(),
        hash,
      );
      setUser({ role, name, email: email.trim().toLowerCase() });
      toast.success(`Welcome back, ${name}!`);
      if (role === UserRole.admin) {
        navigate({ to: "/admin/dashboard" });
      } else if (role === UserRole.provider) {
        navigate({ to: "/provider/dashboard" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      if (
        msg.includes("Invalid") ||
        msg.includes("credentials") ||
        msg.includes("not found")
      ) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Home<span className="text-primary">Ease</span>
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          <div className="text-center mb-7">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Sign In
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back! Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                data-ocid="login.email.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                  data-ocid="login.password.input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setShowForgotMsg(!showForgotMsg)}
                data-ocid="login.forgot_password.button"
              >
                Forgot password?
              </button>
            </div>

            {showForgotMsg && (
              <div
                className="rounded-lg bg-accent/50 border border-border p-3 text-sm text-muted-foreground"
                data-ocid="login.forgot_password.panel"
              >
                Please contact our support team at{" "}
                <span className="font-medium text-foreground">
                  support@homeease.com
                </span>{" "}
                to reset your password.
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-semibold"
              size="lg"
              disabled={loading || isFetching}
              data-ocid="login.submit_button"
            >
              {loading || isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFetching ? "Connecting..." : "Signing in..."}
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
              data-ocid="login.register.link"
            >
              Register here
            </Link>
          </p>

          {/* Admin hint */}
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Admin login: <span className="font-mono">admin@homeease.com</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
