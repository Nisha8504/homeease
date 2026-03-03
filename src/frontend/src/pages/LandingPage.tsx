import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Clock, Shield, Star } from "lucide-react";
import { ServiceCategory, UserRole } from "../backend.d";
import { useAppContext } from "../context/AppContext";
import { SERVICE_INFO, categoryToParam } from "../lib/serviceHelpers";

const SERVICES = Object.values(ServiceCategory);

export default function LandingPage() {
  const { user } = useAppContext();
  const navigate = useNavigate();

  const handleViewProviders = (category: ServiceCategory) => {
    if (!user) {
      navigate({ to: "/login" });
    } else if (user.role === UserRole.customer) {
      navigate({
        to: "/services/$category",
        params: { category: categoryToParam(category) },
      });
    } else if (user.role === UserRole.provider) {
      navigate({ to: "/provider/dashboard" });
    } else if (user.role === UserRole.admin) {
      navigate({ to: "/admin/dashboard" });
    }
  };

  return (
    <main>
      {/* Hero */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 animate-fade-in">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Trusted home service experts near you
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6 animate-fade-up">
              Your Home,{" "}
              <span className="text-gradient">Expertly Cared For</span>
            </h1>
            <p className="text-lg md:text-xl text-white/75 mb-10 leading-relaxed animate-fade-up">
              Connect with verified professionals for all your home service
              needs. From plumbing to pest control — we have you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up">
              <Button
                size="lg"
                className="bg-white text-foreground hover:bg-white/90 font-semibold px-8 shadow-hero"
                onClick={() =>
                  user?.role === UserRole.customer
                    ? document
                        .getElementById("services")
                        ?.scrollIntoView({ behavior: "smooth" })
                    : navigate({ to: "/login" })
                }
                data-ocid="hero.primary_button"
              >
                {user ? "Browse Services" : "Get Started"}
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold px-8"
                  onClick={() => navigate({ to: "/register" })}
                  data-ocid="hero.register.button"
                >
                  Register as Provider
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "500+", label: "Verified Providers" },
                { value: "10k+", label: "Happy Customers" },
                { value: "6", label: "Service Categories" },
                { value: "4.8★", label: "Average Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Our Services
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Professional, reliable, and verified experts for every home
              service need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((category, idx) => {
              const info = SERVICE_INFO[category];
              return (
                <div
                  key={category}
                  className={`rounded-2xl p-6 text-white card-hover shadow-card cursor-pointer relative overflow-hidden group ${info.color}`}
                  data-ocid={`services.card.${idx + 1}`}
                >
                  {/* Background decoration */}
                  <div className="absolute -right-6 -top-6 text-8xl opacity-15 group-hover:opacity-25 transition-opacity select-none pointer-events-none">
                    {info.icon}
                  </div>

                  <div className="relative">
                    <div className="text-4xl mb-4">{info.icon}</div>
                    <h3 className="font-display text-xl font-bold mb-1">
                      {info.label}
                    </h3>
                    <p className="text-white/70 text-sm mb-5">
                      {info.description}
                    </p>
                    <Button
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 border backdrop-blur-sm font-semibold"
                      onClick={() => handleViewProviders(category)}
                      data-ocid={`services.view_providers.button.${idx + 1}`}
                    >
                      View Providers
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              Why Choose HomeEase?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="h-7 w-7 text-primary" />,
                title: "Verified Experts",
                desc: "Every provider is ID-verified and approved by our admin team.",
              },
              {
                icon: <Star className="h-7 w-7 text-amber-500" />,
                title: "Rated & Reviewed",
                desc: "Browse providers sorted by real customer ratings and reviews.",
              },
              {
                icon: <Clock className="h-7 w-7 text-green-500" />,
                title: "Real-time Status",
                desc: "Track your booking from pending to completion in real time.",
              },
              {
                icon: <CheckCircle className="h-7 w-7 text-blue-500" />,
                title: "Pay After Completion",
                desc: "Payment is only requested after the provider marks work done.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-card rounded-xl p-6 shadow-xs border border-border"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  {feat.icon}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto hero-gradient rounded-2xl p-10 text-white shadow-hero">
              <h2 className="font-display text-3xl font-bold mb-3">
                Ready to get started?
              </h2>
              <p className="text-white/75 mb-7">
                Join thousands of satisfied customers and trusted providers on
                HomeEase.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/90 font-semibold"
                  onClick={() => navigate({ to: "/register" })}
                  data-ocid="cta.register.button"
                >
                  Create Account
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => navigate({ to: "/login" })}
                  data-ocid="cta.login.button"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
