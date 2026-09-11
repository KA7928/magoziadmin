"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, ShieldCheck, ArrowRight, Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle, error, loading, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    await loginWithGoogle();
    setIsSigningIn(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-magozi-800/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-magozi-800 text-white shadow-xl shadow-magozi-800/30 font-black text-3xl mb-4 border border-magozi-600/30">
            M
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Magozi <span className="text-magozi-400">Admin</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Grocery & Food Delivery Management Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-white">Google Administrator Authentication</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Sign in with your authorized Google Gmail account. Your email will be verified against Cloud Firestore <code className="text-emerald-400 font-mono">admins</code> collection.
            </p>
          </div>

          {/* Access Denied / Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs font-semibold flex items-start gap-3 animate-in fade-in">
              <ShieldAlert size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="block font-extrabold text-rose-100">{error}</span>
                <span className="block text-[11px] text-rose-300 mt-1">
                  Your Gmail is not registered as an admin in Firestore <code className="font-mono">admins</code> collection.
                </span>
                <button
                  onClick={clearError}
                  className="mt-2 text-[11px] font-bold underline text-rose-300 hover:text-white"
                >
                  Dismiss Error
                </button>
              </div>
            </div>
          )}

          {/* Single Primary Google Sign-In Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || loading}
              className="w-full py-4 px-6 rounded-2xl bg-magozi-800 hover:bg-magozi-700 text-white font-extrabold text-sm shadow-xl shadow-magozi-800/30 transition flex items-center justify-center gap-3 disabled:opacity-50 border border-magozi-600/30"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? "Verifying Gmail Admin Role..." : "Sign In With Google Gmail"}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Strict Firestore Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
