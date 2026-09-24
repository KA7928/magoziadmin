"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { seedFirestoreDatabase } from "@/lib/seeder";
import { getFirebaseConfig, saveCustomFirebaseConfig } from "@/lib/firebase";
import { Database, ShieldCheck, CheckCircle2, RefreshCw, Key, X, Settings, Menu, Sun, Moon } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { adminEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Firebase Config Form State
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  useEffect(() => {
    const cfg = getFirebaseConfig();
    setApiKey(cfg.apiKey || "");
    setAuthDomain(cfg.authDomain || "");
    setProjectId(cfg.projectId || "");
    setStorageBucket(cfg.storageBucket || "");
    setMessagingSenderId(cfg.messagingSenderId || "");
    setAppId(cfg.appId || "");
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedMessage(null);
    const res = await seedFirestoreDatabase();
    setSeeding(false);
    setSeedMessage(res.message);
    setTimeout(() => setSeedMessage(null), 4000);
  };

  const handleSaveFirebaseKeys = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-menu"))}
          className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-xs flex-shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
          title={theme === "dark" ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"}
          aria-label="Toggle Dark Mode"
        >
          {theme === "dark" ? (
            <>
              <Sun size={16} className="text-amber-400 fill-amber-400 animate-in spin-in-90 duration-300" />
              <span className="font-extrabold text-amber-500">Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} className="text-indigo-600 fill-indigo-600 dark:text-indigo-400 animate-in spin-in-90 duration-300" />
              <span className="font-extrabold text-slate-700 dark:text-slate-200">Dark Mode</span>
            </>
          )}
        </button>

        {/* Firebase Config Keys Button */}
        <button
          onClick={() => setShowConfigModal(true)}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm"
          title="Connect or Edit your Real Firebase Credentials"
        >
          <Key size={16} className="text-slate-600 dark:text-slate-300" />
        </button>

        {/* Firestore Seeder Button */}
        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-magozi-800 dark:text-emerald-400 border border-magozi-200 dark:border-emerald-800/60 hover:bg-magozi-100 dark:hover:bg-emerald-900/60 transition shadow-sm disabled:opacity-50"
          title="Populate Cloud Firestore with production schema & default admin permissions"
        >
          {seeding ? (
            <RefreshCw size={16} className="animate-spin text-magozi-700 dark:text-emerald-400" />
          ) : (
            <Database size={16} className="text-magozi-700 dark:text-emerald-400" />
          )}
        </button>

        {/* Admin Email Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-slate-900 dark:text-slate-100">{adminEmail || "Verified Admin"}</span>
        </div>
      </div>

      {seedMessage && (
        <div className="absolute top-full left-6 right-6 mt-2 p-3 rounded-xl bg-emerald-600 text-white text-xs font-medium shadow-xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{seedMessage}</span>
        </div>
      )}

      {/* Firebase Keys Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Settings size={20} className="text-magozi-800" />
                  <span>Real Firebase Project Credentials</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Connect your live Firebase App to show real values directly from your Cloud Firestore database
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFirebaseKeys} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  API Key (apiKey)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Auth Domain (authDomain)
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="your-project.firebaseapp.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Project ID (projectId)
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="your-project-id"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Storage Bucket (storageBucket)
                </label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="your-project.appspot.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Messaging Sender ID (messagingSenderId)
                </label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  App ID (appId)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:1234567890:web:abcdef..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  Or edit <code className="text-slate-800 font-bold">.env.local</code> in project root.
                </p>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md transition"
                >
                  Save & Reload App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
