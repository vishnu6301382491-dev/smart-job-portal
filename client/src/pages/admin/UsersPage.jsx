import { useEffect, useState } from "react";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Loader } from "../../components/ui/Loader";
import { adminService } from "../../services/adminService";
import { getErrorMessage } from "../../services/error";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await adminService.users();
      setUsers(data.users || []);
      const initialRoles = {};
      (data.users || []).forEach((user) => {
        initialRoles[user._id] = user.role;
      });
      setRoles(initialRoles);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleSave = async (userId) => {
    try {
      await adminService.updateUserRole(userId, { role: roles[userId] });
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update user role"));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update user status"));
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = window.confirm("Delete this user? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete user"));
    }
  };

  return (
    <PageShell
      title="Manage users"
      description="Review and moderate user accounts, including roles and active status."
      actions={[]}
    >
      {loading ? (
        <Loader label="Loading users" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Suspended"}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={roles[user._id] || user.role}
                  onChange={(event) => setRoles({ ...roles, [user._id]: event.target.value })}
                >
                  <option value="jobseeker">Job Seeker</option>
                  <option value="employer">Employer</option>
                  <option value="admin">Admin</option>
                </Select>
                <Button variant="secondary" type="button" onClick={() => handleRoleSave(user._id)}>
                  Save Role
                </Button>
                <Button variant="secondary" type="button" onClick={() => handleToggleStatus(user._id)}>
                  {user.isActive ? "Suspend" : "Activate"}
                </Button>
                <Button variant="danger" type="button" onClick={() => handleDelete(user._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          No users found.
        </div>
      )}
    </PageShell>
  );
};

export default UsersPage;
