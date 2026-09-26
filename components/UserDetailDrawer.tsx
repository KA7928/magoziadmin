"use client";

import React from "react";
import { UserProfile } from "@/lib/types";
import { formatAddressItem, formatStringValue } from "@/lib/utils";
import { X, ShieldCheck, ShieldAlert, MapPin, Phone, Mail, Calendar, Trash2, Hash } from "lucide-react";

interface UserDetailDrawerProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onToggleAdminRole: (user: UserProfile) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

export default function UserDetailDrawer({
  isOpen,
  user,
  onClose,
  onToggleAdminRole,
  onDeleteUser,
}: UserDetailDrawerProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
        <div>
          {/* Header with Avatar & Magozi ID */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {user.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-magozi-800 font-extrabold flex items-center justify-center text-lg border-2 border-emerald-500 shadow-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  User Profile & Account
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">{user.fullName}</h3>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-mono font-bold">
                  <Hash size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Magozi ID: {user.magoziId || user.id}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Admin Role Toggle Banner */}
          <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.role === "admin" ? (
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-magozi-800 dark:text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <ShieldAlert size={20} />
                </div>
              )}
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white uppercase">
                  Current Role: {user.role.toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user.role === "admin"
                    ? "Has full administrator privileges"
                    : "Standard customer app privileges"}
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleAdminRole(user)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                user.role === "admin"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  : "bg-magozi-800 text-white hover:bg-magozi-900 shadow-magozi-800/20"
              }`}
            >
              {user.role === "admin" ? "Revoke Admin" : "Grant Admin"}
            </button>
          </div>

          {/* Contact Details & Join Date */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Mail size={16} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Phone size={16} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0" />
              <span>{user.phone}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Calendar size={16} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0" />
              <span>Registration Date (registrationDate): <strong className="text-slate-900 dark:text-white">{user.registrationDate || user.registeredDate || user.createdAt || "N/A"}</strong></span>
            </div>
          </div>

          {/* Location & Delivery Addresses */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Location & Delivery Addresses (deliveryAddresses)</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-[11px]">
                {user.addressesCount || (user.location ? 1 : 0)} Saved
              </span>
            </h4>

            {user.location && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2.5 mb-3">
                <MapPin size={16} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Primary Location</span>
                  <p className="leading-relaxed font-semibold">{user.location}</p>
                </div>
              </div>
            )}

            {(user.deliveryAddresses || user.savedAddresses || user.addresses) && (user.deliveryAddresses || user.savedAddresses || user.addresses)!.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">All deliveryAddresses:</span>
                {(user.deliveryAddresses || user.savedAddresses || user.addresses)!.map((addr: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <MapPin size={14} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-semibold text-slate-800 dark:text-slate-200">{formatAddressItem(addr)}</span>
                  </div>
                ))}
              </div>
            ) : (
              !user.location && <p className="text-xs text-slate-400 italic">No deliveryAddresses found on user document</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {onDeleteUser && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete user "${user.fullName}" from Cloud Firestore?`)) {
                  onDeleteUser(user.id);
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              <span>Delete User Account from Firestore</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
