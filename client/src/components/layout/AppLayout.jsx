import { Outlet } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)]">
      <SiteHeader />
      <main className="pb-16 pt-8">
        <Outlet />
      </main>
    </div>
  );
};
