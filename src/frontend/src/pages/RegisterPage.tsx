import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ServiceCategory, UserRole } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { hashPassword } from "../lib/crypto";
import { SERVICE_INFO } from "../lib/serviceHelpers";

type RegisterMode = "customer" | "provider";

export default function RegisterPage() {
  const { actor, isFetching } = useActor();
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState<RegisterMode>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | "">(
    "",
  );
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("Please wait, connecting to server...");
      return;
    }
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (mode === "provider" && !serviceCategory) {
      toast.error("Please select a service category.");
      return;
    }

    setLoading(true);
    try {
      const hash = await hashPassword(password);
      const trimmedEmail = email.trim().toLowerCase();

      if (mode === "customer") {
        await actor.registerCustomer(trimmedEmail, hash, name.trim());
        toast.success("Account created successfully! Please log in.");
        navigate({ to: "/login" });
      } else {
        await actor.registerProvider(
          trimmedEmail,
          hash,
          name.trim(),
          serviceCategory as ServiceCategory,
        );
        // Auto-login provider and redirect to dashboard so they can upload ID proof immediately
        setUser({
          role: UserRole.provider,
          name: name.trim(),
          email: trimmedEmail,
        });
        toast.success(
          "Account created! Please upload your ID proof for verification.",
        );
        navigate({ to: "/provider/dashboard" });
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.reject_message ||
        (typeof err === "string" ? err : "") ||
        "";
      if (msg.includes("already") || msg.includes("exists")) {
        toast.error("An account with this email already exists.");
      } else if (msg.includes("principal") || msg.includes("Principal")) {
        toast.error(
          "Registration failed: account already exists for this identity.",
        );
      } else {
        toast.error(
          msg
            ? `Registration failed: ${msg}`
            : "Registration failed. Please try again.",
        );
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
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Join HomeEase as a customer or service provider.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-xl border border-border p-1 mb-6 bg-secondary/40">
            {(["customer", "provider"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  mode === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setMode(m)}
                data-ocid={`register.${m}.tab`}
              >
                {m === "customer" ? "Customer" : "Service Provider"}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                data-ocid="register.name.input"
              />
            </div>

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
                data-ocid="register.email.input"
              />
            </div>

            {mode === "provider" && (
              <div className="space-y-1.5">
                <Label htmlFor="service-category">Service Category</Label>
                <Select
                  value={serviceCategory}
                  onValueChange={(v) =>
                    setServiceCategory(v as ServiceCategory)
                  }
                >
                  <SelectTrigger
                    id="service-category"
                    data-ocid="register.service_category.select"
                  >
                    <SelectValue placeholder="Select your service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ServiceCategory).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {SERVICE_INFO[cat].icon} {SERVICE_INFO[cat].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="pr-10"
                  data-ocid="register.password.input"
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

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                data-ocid="register.confirm_password.input"
              />
              {confirmPassword && confirmPassword !== password && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="register.password.error_state"
                >
                  Passwords do not match
                </p>
              )}
            </div>

            {mode === "provider" && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                <strong>Note:</strong> After registration, you'll be taken
                directly to your dashboard to upload your ID proof. Admin
                verification is required before you appear in the provider list.
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-semibold"
              size="lg"
              disabled={loading || isFetching}
              data-ocid="register.submit_button"
            >
              {loading || isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFetching ? "Connecting..." : "Creating account..."}
                </>
              ) : (
                `Create ${mode === "customer" ? "Customer" : "Provider"} Account`
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
              data-ocid="register.login.link"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
