import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { UserRole } from "./backend.d";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { AppProvider, useAppContext } from "./context/AppContext";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BookingPage from "./pages/BookingPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import ProviderListPage from "./pages/ProviderListPage";
import RegisterPage from "./pages/RegisterPage";

function getSessionUser() {
  try {
    const stored = localStorage.getItem("homeserve_session");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <AppProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
        <Toaster richColors position="top-right" />
      </div>
    </AppProvider>
  ),
});

// Landing
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// Login
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => {
    const user = getSessionUser();
    if (user) {
      if (user.role === UserRole.admin)
        throw redirect({ to: "/admin/dashboard" });
      if (user.role === UserRole.provider)
        throw redirect({ to: "/provider/dashboard" });
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

// Register
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: () => {
    const user = getSessionUser();
    if (user) throw redirect({ to: "/" });
  },
  component: RegisterPage,
});

// Services (customer only)
const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/$category",
  beforeLoad: () => {
    const user = getSessionUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== UserRole.customer) throw redirect({ to: "/" });
  },
  component: ProviderListPage,
});

// Booking (customer only)
const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/book/$providerId/$category",
  beforeLoad: () => {
    const user = getSessionUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== UserRole.customer) throw redirect({ to: "/" });
  },
  component: BookingPage,
});

// My Bookings (customer only)
const myBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-bookings",
  beforeLoad: () => {
    const user = getSessionUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== UserRole.customer) throw redirect({ to: "/" });
  },
  component: MyBookingsPage,
});

// Provider Dashboard
const providerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/provider/dashboard",
  beforeLoad: () => {
    const user = getSessionUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== UserRole.provider) throw redirect({ to: "/" });
  },
  component: ProviderDashboardPage,
});

// Admin Dashboard
const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  beforeLoad: () => {
    const user = getSessionUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== UserRole.admin) throw redirect({ to: "/" });
  },
  component: AdminDashboardPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  servicesRoute,
  bookingRoute,
  myBookingsRoute,
  providerDashboardRoute,
  adminDashboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

export { Link, useNavigate };
