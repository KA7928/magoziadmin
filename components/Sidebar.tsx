"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  PackageCheck, 
  BellRing, 
  Users, 
  Sliders, 
  Image as ImageIcon, 
  Store,
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: ShoppingBag },
  { name: "Orders", href: "/orders", icon: PackageCheck, badge: "Live" },
  { name: "Push Notifications", href: "/notifications", icon: BellRing },
  { name: "Users & Roles", href: "/users", icon: Users },
  { name: "App Charges & Config", href: "/app-config", icon: Sliders },
  { name: "Banners Management", href: "/banners", icon: ImageIcon },
  { name: "Superstores", href: "/stores", icon: Store },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, adminEmail } = useAuth();

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-menu", handleToggle);
    return () => window.removeEventListener("toggle-mobile-menu", handleToggle);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 bg-slate-900 text-white border-r border-slate-800 flex flex-col justify-between ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <Link 
              href="/dashboard" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 overflow-hidden"
            >
              <img 
                src="/logo.png" 
                alt="Magozi Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5 shadow-lg shadow-magozi-800/30 flex-shrink-0" 
              />
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                    Magozi <span className="text-xs px-2 py-0.5 rounded bg-magozi-800 text-magozi-50 font-semibold">ADMIN</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Grocery & Food Delivery</span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  } ${collapsed && !mobileOpen ? "justify-center" : ""}`}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                >
                  <Icon size={20} className={isActive ? "text-magozi-100" : "text-slate-400"} />
                  {(!collapsed || mobileOpen) && <span className="flex-1 truncate">{item.name}</span>}
                  {(!collapsed || mobileOpen) && item.badge && (
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Section */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {(!collapsed || mobileOpen) && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
              <div className="truncate text-xs">
                <p className="text-slate-200 font-semibold truncate">{adminEmail || "Google Verified Admin"}</p>
                <p className="text-[10px] text-slate-400">Firebase Verified Admin</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 transition ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
            title="Sign Out"
          >
            <LogOut size={18} />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
