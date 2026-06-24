import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

const NotificationPreferenceControls = ({
  user,
  onTogglePreference,
  savingKey = "",
  title = "Quick controls",
  description = "Manage the in-app alerts you want to keep seeing.",
  className = "",
}) => {
  const savedJobUpdatesEnabled = user?.notificationPrefs?.savedJobUpdates !== false;
  const matchedJobsEnabled = user?.notificationPrefs?.matchedJobs !== false;

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Flip in-app alert types on the fly</h3>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={savedJobUpdatesEnabled ? "success" : "warning"}>
            Saved jobs: {savedJobUpdatesEnabled ? "On" : "Off"}
          </Badge>
          <Badge variant={matchedJobsEnabled ? "success" : "warning"}>
            Matching jobs: {matchedJobsEnabled ? "On" : "Off"}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-sm font-semibold text-white">Saved job alerts</p>
          <p className="mt-1 text-sm text-slate-400">Get notified when a role you saved changes or gets removed.</p>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant={savedJobUpdatesEnabled ? "ghost" : "secondary"}
              disabled={savingKey === "savedJobUpdates"}
              onClick={() => void onTogglePreference("savedJobUpdates")}
            >
              {savingKey === "savedJobUpdates" ? "Saving..." : savedJobUpdatesEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-sm font-semibold text-white">Matching job alerts</p>
          <p className="mt-1 text-sm text-slate-400">Get notified when a new role matches the skills in your profile.</p>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant={matchedJobsEnabled ? "ghost" : "secondary"}
              disabled={savingKey === "matchedJobs"}
              onClick={() => void onTogglePreference("matchedJobs")}
            >
              {savingKey === "matchedJobs" ? "Saving..." : matchedJobsEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferenceControls;
