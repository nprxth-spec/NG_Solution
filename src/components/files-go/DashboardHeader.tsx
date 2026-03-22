"use client";

import { Zap, LogOut } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function DashboardHeader({
  user,
  credits,
  plan = "free",
}: {
  user: HeaderUser | null | undefined;
  credits: number;
  plan?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false);
    await signOut({ callbackUrl: "/" });
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="h-14 sm:h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0">
        <div />

        <div className="flex items-center gap-2 sm:gap-4 relative" ref={menuRef}>
          {/* Credits badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-teal-50 border border-teal-100">
            <Zap className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-teal-700">
              {plan === "pro" ? "Unlimited" : credits}
            </span>
            <span className="hidden sm:inline text-xs text-teal-500">credits</span>
          </div>

          {/* User avatar as profile menu trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:ring-2 hover:ring-slate-200 transition-all cursor-pointer shrink-0"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={36}
                height={36}
                className="rounded-full ring-2 ring-white shadow w-8 h-8 sm:w-9 sm:h-9 object-cover"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full landing-accent-bg flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0] ?? "U"}
              </div>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 sm:w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 text-sm z-20">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Account
                </p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowSignOutConfirm(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
            <p className="text-base font-semibold text-slate-900 mb-2">
              Sign out?
            </p>
            <p className="text-sm text-slate-500 mb-5">
              You will be signed out of Files Go and need to sign in again to continue.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

