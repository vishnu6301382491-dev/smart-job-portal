import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "jobseeker",
    headline: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, authReady, user } = useAuth();
  const redirectTo =
    location.state?.from?.pathname || (user?.role === "employer" ? "/employer" : "/dashboard");

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
      const { data } = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        title: form.headline,
      });

      login(data);
      const nextRoute = data.user?.role === "employer" ? "/employer" : "/dashboard";
      navigate(location.state?.from?.pathname || nextRoute, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create account"));
    } finally {
      setLoading(false);
    }
  };

  if (authReady && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <PageShell
      title="Create your account"
      description="Join as a jobseeker or employer and get started with a secure local-first workflow."
      actions={[]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Badge variant="info">Create a secure account</Badge>
        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
        <Input
          type="text"
          label="Full Name"
          placeholder="Alex Johnson"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
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
        <Select
          label="Account Type"
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
        >
          <option value="jobseeker">Job Seeker</option>
          <option value="employer">Employer</option>
        </Select>
        <Textarea
          label="Headline"
          placeholder="Optional short intro that appears on your profile"
          value={form.headline}
          onChange={(event) => setForm({ ...form, headline: event.target.value })}
        />
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </Button>
          <Link className="text-sm text-cyan-300 hover:text-cyan-200" to="/login">
            Already have an account?
          </Link>
        </div>
      </form>
    </PageShell>
  );
};

export default RegisterPage;
