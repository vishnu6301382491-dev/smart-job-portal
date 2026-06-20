import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import JobsPage from "../pages/jobs/JobsPage";
import JobDetailsPage from "../pages/jobs/JobDetailsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import AppliedJobsPage from "../pages/applications/AppliedJobsPage";
import EmployerDashboardPage from "../pages/employer/EmployerDashboardPage";
import PostJobPage from "../pages/employer/PostJobPage";
import EditJobPage from "../pages/employer/EditJobPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import JobsManagementPage from "../pages/admin/JobsManagementPage";
import EmployersPage from "../pages/admin/EmployersPage";
import NotFoundPage from "../pages/NotFoundPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/applications" element={<AppliedJobsPage />} />

            <Route element={<RoleRoute allowedRoles={["employer", "admin"]} />}>
              <Route path="/employer" element={<EmployerDashboardPage />} />
              <Route path="/employer/jobs/new" element={<PostJobPage />} />
              <Route path="/employer/jobs/:id/edit" element={<EditJobPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/jobs" element={<JobsManagementPage />} />
              <Route path="/admin/employers" element={<EmployersPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

