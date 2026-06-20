import { useEffect, useState } from "react";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    title: "",
    location: "",
    phone: "",
    skills: "",
    bio: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await userService.me();

        if (cancelled) {
          return;
        }

        const profile = data.user;
        setCurrentUser(profile);
        setForm({
          name: profile.name || "",
          title: profile.title || "",
          location: profile.location || "",
          phone: profile.phone || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
          bio: profile.bio || "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load your profile"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await userService.updateProfile(form);
      setCurrentUser(data.user);
      updateUser(data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      setError("Please choose a PDF resume first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await userService.uploadResume(resumeFile);
      setCurrentUser(data.user);
      updateUser(data.user);
      setResumeFile(null);
      setMessage("Resume uploaded successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload resume"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      title="My profile"
      description="Update your profile details, skills, and resume so employers can find the right fit."
      actions={[]}
    >
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <Loader label="Loading profile" />
        </div>
      ) : (
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-5">
          <div>
            <Badge variant="info">Profile summary</Badge>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              {currentUser?.name || user?.name || "Make your profile discoverable"}
            </h3>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-sm text-slate-400">Visibility</p>
            <p className="mt-1 text-lg font-semibold text-white">Open to opportunities</p>
            <p className="mt-2 text-sm text-slate-400">{currentUser?.title || "Add a title to describe your role"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-sm text-slate-400">Resume</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {currentUser?.resumeName || "Upload PDF ready"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {currentUser?.resumeUrl
                ? "Your latest resume is ready for employers."
                : "Keep a clean version of your resume for applications."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-sm text-slate-400">Current status</p>
            <p className="mt-1 text-lg font-semibold text-white">{currentUser?.bio || "No bio added yet"}</p>
          </div>
        </Card>

        <div className="space-y-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {error ? (
              <div className="md:col-span-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="md:col-span-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                {message}
              </div>
            ) : null}
            <Input
              label="Name"
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              label="Title"
              type="text"
              placeholder="Frontend Developer"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <Input
              label="Location"
              type="text"
              placeholder="Bangalore, India"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 90000 00000"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
            <Input
              className="md:col-span-2"
              label="Skills"
              type="text"
              placeholder="React, Node.js, MongoDB"
              value={form.skills}
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
            <Textarea
              className="md:col-span-2"
              label="Bio"
              placeholder="A short professional summary"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>

          <form className="rounded-3xl border border-white/10 bg-white/5 p-6" onSubmit={handleResumeUpload}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Resume Upload</p>
                <h4 className="mt-2 text-lg font-semibold text-white">Upload your latest PDF resume</h4>
              </div>
              {currentUser?.resumeUrl ? (
                <Badge variant="success">Ready</Badge>
              ) : (
                <Badge variant="warning">Missing</Badge>
              )}
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-slate-200">Resume PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                className="block w-full rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-950"
              />
            </label>
            <div className="mt-4 flex justify-end">
              <Button type="submit" variant="secondary" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Resume"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      )}
    </PageShell>
  );
};

export default ProfilePage;
