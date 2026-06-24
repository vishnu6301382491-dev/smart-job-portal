import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, authReady } = useAuth();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    void authService.health().catch(() => {
      // Background warm-up only.
    });

    if (authReady && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [authReady, isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await authService.login(form);
      login(data);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in"));
    } finally {
      setLoading(false);
    }
  };

  if (authReady && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <PageShell
      title="Welcome back"
      description="Sign in to continue managing your Smart Job Portal workspace."
      actions={[]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Badge variant="info">JWT secured login</Badge>
        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
          <Link className="text-sm text-cyan-300 hover:text-cyan-200" to="/register">
            Need an account?
          </Link>
        </div>
      </form>
    </PageShell>
  );
};

export default LoginPage;
