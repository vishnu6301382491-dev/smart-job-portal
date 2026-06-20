import { useEffect, useState } from "react";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { adminService } from "../../services/adminService";
import { getErrorMessage } from "../../services/error";

const EmployersPage = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await adminService.employers();
      setEmployers(data.employers || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load employers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployers();
  }, []);

  const handleDelete = async (employerId) => {
    const confirmed = window.confirm("Delete this employer profile? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await adminService.deleteEmployer(employerId);
      await loadEmployers();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete employer"));
    }
  };

  return (
    <PageShell
      title="Manage employers"
      description="Review employer accounts and company profiles."
      actions={[]}
    >
      {loading ? (
        <Loader label="Loading employers" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : employers.length > 0 ? (
        <div className="space-y-4">
          {employers.map((employer) => (
            <div
              key={employer._id}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{employer.companyName}</h3>
                <p className="mt-1 text-sm text-slate-400">Owner: {employer.user?.name || "Unknown"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={employer.status === "active" ? "success" : "warning"}>{employer.status}</Badge>
                <Button variant="danger" type="button" onClick={() => handleDelete(employer._id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          No employers found.
        </div>
      )}
    </PageShell>
  );
};

export default EmployersPage;
