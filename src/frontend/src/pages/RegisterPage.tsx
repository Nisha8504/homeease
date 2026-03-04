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
import {
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Upload,
  Wrench,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ServiceCategory, type UserRole } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";
import { hashPassword } from "../lib/crypto";
import { SERVICE_INFO } from "../lib/serviceHelpers";

type RegisterMode = "customer" | "provider";
type RegisterStep = "form" | "id-upload";

export default function RegisterPage() {
  const { actor, isFetching } = useActor();
  const { setUser } = useAppContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState<RegisterMode>("customer");
  const [step, setStep] = useState<RegisterStep>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | "">(
    "",
  );
  const [loading, setLoading] = useState(false);

  // ID proof upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Immediately call loginWithCredentials to remap the newly registered
        // provider's data to the current anonymous principal via the backend
        // remap logic. This prevents principal collisions when switching
        // between provider and customer accounts in the same browser session.
        const [role, userName] = await actor.loginWithCredentials(
          trimmedEmail,
          hash,
        );
        setUser({
          role: role as unknown as UserRole,
          name: userName,
          email: trimmedEmail,
        });
        // Move to ID upload step instead of navigating away
        setStep("id-upload");
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

  const handleUploadIdProof = async () => {
    if (!actor || !selectedFile) return;
    setUploading(true);
    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const blobId = `sha256:${hashHex}`;
      await actor.uploadIdProof(blobId);

      // Store the file as base64 in localStorage so admin can preview it
      // Only store if file is under 1.5MB to avoid quota issues
      if (selectedFile.size <= 1.5 * 1024 * 1024) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              if (reader.result) {
                localStorage.setItem(
                  `idproof_${blobId}`,
                  reader.result as string,
                );
              }
            } catch {
              // localStorage quota exceeded — ignore silently
            }
          };
          reader.readAsDataURL(selectedFile);
        } catch {
          // FileReader error — ignore silently
        }
      }

      setUploadDone(true);
      toast.success("ID proof submitted! Admin will verify and approve you.");
    } catch (_err) {
      toast.error("Upload failed. You can try again from your dashboard.");
    } finally {
      setUploading(false);
    }
  };

  const handleSkipUpload = () => {
    navigate({ to: "/provider/dashboard" });
  };

  const handleContinueToDashboard = () => {
    navigate({ to: "/provider/dashboard" });
  };

  // --- ID Proof Upload Step ---
  if (step === "id-upload") {
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
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                1
              </div>
              <div className="h-px flex-1 bg-primary/30" />
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
            </div>

            {!uploadDone ? (
              <>
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileText className="h-7 w-7" />
                    </div>
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Upload ID Proof
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Account created for{" "}
                    <span className="font-medium text-foreground">{name}</span>.
                    Now upload your government-issued ID for verification.
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-5">
                  <strong>Required:</strong> You must upload ID proof before
                  admin can approve your account. Only approved providers appear
                  in the customer list.
                </div>

                {/* File drop zone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  data-ocid="register.id_proof.upload_button"
                />
                <button
                  type="button"
                  className={cn(
                    "w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    selectedFile
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-secondary/30",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  data-ocid="register.id_proof.dropzone"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-primary" />
                      <p className="font-medium text-foreground text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click to
                        change
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-10 w-10" />
                      <p className="font-medium text-sm">
                        Click to select your ID document
                      </p>
                      <p className="text-xs">
                        Accepted: JPG, PNG, PDF (max 5 MB)
                      </p>
                    </div>
                  )}
                </button>

                <div className="flex gap-3 mt-5">
                  <Button
                    variant="outline"
                    className="flex-1 text-muted-foreground"
                    onClick={handleSkipUpload}
                    data-ocid="register.skip_upload.button"
                  >
                    Skip for now
                  </Button>
                  <Button
                    className="flex-1 font-semibold"
                    onClick={handleUploadIdProof}
                    disabled={!selectedFile || uploading}
                    data-ocid="register.upload_id.submit_button"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit ID Proof
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Upload success state */
              <div
                className="text-center"
                data-ocid="register.upload.success_state"
              >
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">
                  ID Proof Submitted!
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Your account is under review. Admin will verify your ID and
                  approve you shortly. You'll appear in the provider list once
                  approved.
                </p>
                <Button
                  className="w-full font-semibold"
                  onClick={handleContinueToDashboard}
                  data-ocid="register.go_to_dashboard.button"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // --- Registration Form Step ---
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

          {mode === "provider" && (
            <div className="flex items-center gap-3 mb-5 text-xs text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                1
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border text-muted-foreground text-xs font-bold shrink-0">
                2
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                Upload ID
              </span>
            </div>
          )}

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
              ) : mode === "provider" ? (
                "Next: Upload ID Proof"
              ) : (
                "Create Customer Account"
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
