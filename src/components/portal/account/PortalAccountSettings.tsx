"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { updateProfile, deleteAccount, getUserPasswordStatus, setUserPassword, changeUserPassword } from "@/app/(portal)/dashboard/actions";
import { User, Mail, Save, Loader2, Link as LinkIcon, AlertCircle, AlertTriangle, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PortalAccountSettings() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateProfile({ name });
      await update({ name }); // update next-auth session
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      await signOut({ callbackUrl: "/login" });
    } catch (err: any) {
      setError(err.message || "Failed to delete account.");
      setDeleteLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-800/40 dark:border-white/10">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Profile Information</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm transition-opacity">
              Profile updated successfully!
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                placeholder="Your display name"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={session?.user?.email || ""}
                readOnly
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email is associated with your login provider and cannot be changed here.</p>
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading || name === session?.user?.name}
              className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <PasswordSettingsSection />

      <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-6 shadow-sm dark:bg-rose-950/10 dark:border-rose-900/40">
        <h3 className="text-lg font-bold text-rose-600 dark:text-rose-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Once you delete your account, there is no going back. Please be certain. All data will be permanently wiped.
        </p>

        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-rose-500/20"
              >
                Delete Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl overflow-hidden max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-rose-600">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-100">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function PasswordSettingsSection() {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Fetch password status on mount
  useEffect(() => {
    getUserPasswordStatus().then((res: { hasPassword: boolean }) => setHasPassword(res.hasPassword));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.new.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.new !== formData.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (hasPassword) {
        await changeUserPassword({ current: formData.current, new: formData.new });
        setSuccess("Password changed successfully!");
      } else {
        await setUserPassword(formData.new);
        setHasPassword(true);
        setSuccess("Password set successfully!");
      }
      setFormData({ current: "", new: "", confirm: "" });
      setIsChanging(false);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (hasPassword === null) return null;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-800/40 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Password Settings</h3>
        {!isChanging && hasPassword && (
          <button
            onClick={() => setIsChanging(true)}
            className="text-sm font-semibold text-teal-500 hover:text-teal-600 transition-colors"
          >
            Change Password
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm mb-4">
          {success}
        </div>
      )}

      {(!hasPassword && !isChanging) ? (
        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You haven't set a password yet. Set one now to enable password login.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setIsChanging(true)}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-teal-500/20"
            >
              Set Password
            </button>
          </div>
        </div>
      ) : isChanging ? (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">

          
          {hasPassword && isChanging && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Current Password</label>
              <input
                type="password"
                value={formData.current}
                onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">New Password</label>
            <input
              type="password"
              value={formData.new}
              onChange={(e) => setFormData({ ...formData, new: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Confirm New Password</label>
            <input
              type="password"
              value={formData.confirm}
              onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {isChanging && (
              <button
                type="button"
                onClick={() => setIsChanging(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-teal-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {hasPassword ? "Update Password" : "Set Password"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password is set</p>
            <p className="text-xs text-slate-400">You can use your email and password to sign in.</p>
          </div>
        </div>
      )}
    </div>
  );
}


