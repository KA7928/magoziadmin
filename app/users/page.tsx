"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import UserDetailDrawer from "@/components/UserDetailDrawer";
import { UserProfile } from "@/lib/types";
import { db, collection, onSnapshot, doc, setDoc, deleteDoc } from "@/lib/firebase";
import { formatDate, formatAddressItem, formatStringValue } from "@/lib/utils";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Eye,
  Trash2,
  Calendar,
  MapPin,
  User as UserIcon,
  Hash
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Realtime Cloud Firestore Listener for Users
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const list: UserProfile[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawDate = 
            data.registrationDate ?? 
            data.registration_date ?? 
            data.createdAt ?? 
            data.created_at ?? 
            data.registeredDate ?? 
            data.registered_date ?? 
            data.joinedAt ?? 
            data.joined_date ?? 
            data.dateJoined ?? 
            data.timestamp;
          const formattedDate = formatDate(rawDate);

          const magoziIdVal = formatStringValue(data.magoziId || data.magozi_id || data.magoziID || docSnap.id);
          const photoUrlVal = typeof data.photoUrl === "string" ? data.photoUrl : (typeof data.photoURL === "string" ? data.photoURL : (typeof data.profilePic === "string" ? data.profilePic : ""));
          
          // Parse deliveryAddresses field from Firestore (with fallbacks to delivery_addresses, savedAddresses, addresses)
          const rawDelivery = data.deliveryAddresses || data.delivery_addresses || data.savedAddresses || data.addresses || [];
          let deliveryArr: any[] = [];
          if (Array.isArray(rawDelivery)) {
            deliveryArr = rawDelivery;
          } else if (rawDelivery) {
            deliveryArr = [rawDelivery];
          }

          const formattedAddrs = deliveryArr.map((a) => formatAddressItem(a)).filter(Boolean);

          const rawLoc = data.location ?? data.address;
          const locStr = rawLoc ? formatStringValue(rawLoc) : "";

          const locationVal = 
            locStr || 
            (formattedAddrs.length > 0 ? formattedAddrs[0] : "") || 
            "";

          return {
            id: docSnap.id,
            magoziId: magoziIdVal,
            fullName: data.fullName || data.displayName || data.name || "App User",
            email: data.email || "N/A",
            phone: data.phone || data.phoneNumber || "N/A",
            photoUrl: photoUrlVal,
            deliveryAddresses: formattedAddrs,
            savedAddresses: formattedAddrs,
            location: locationVal,
            addressesCount: formattedAddrs.length || (locationVal ? 1 : 0),
            registrationDate: formattedDate,
            registeredDate: formattedDate,
            createdAt: formattedDate,
            role: data.role || "user",
            addresses: formattedAddrs,
          } as UserProfile;
        });
        setUsers(list);
      }, (err) => console.warn("Firestore users listener warning:", err));
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore users connection error:", e);
    }
  }, []);

  // Grant or Revoke Admin Role in Firestore `admins` collection
  const handleToggleAdminRole = async (targetUser: UserProfile) => {
    const nextRole = targetUser.role === "admin" ? "user" : "admin";
    const userEmail = targetUser.email.toLowerCase();

    try {
      if (nextRole === "admin") {
        await setDoc(doc(db, "admins", userEmail), {
          email: userEmail,
          role: "admin",
          uid: targetUser.id,
          assignedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        await deleteDoc(doc(db, "admins", userEmail));
      }

      await setDoc(doc(db, "users", targetUser.id), { role: nextRole }, { merge: true });

      if (selectedUser && selectedUser.id === targetUser.id) {
        setSelectedUser({ ...selectedUser, role: nextRole });
      }
    } catch (err) {
      console.error("Error toggling admin role in Firestore:", err);
    }
  };

  // Delete User from Firestore `users` collection
  const handleDeleteUser = async (userId: string) => {
    // Update local state immediately
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      console.error("Error deleting user from Firestore:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const addrsString = (u.deliveryAddresses || u.savedAddresses || []).join(" ").toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.magoziId && u.magoziId.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.location && u.location.toLowerCase().includes(q)) ||
      addrsString.includes(q) ||
      (u.registrationDate && u.registrationDate.toLowerCase().includes(q)) ||
      (u.createdAt && u.createdAt.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="User & Roles Management"
          subtitle="Realtime Firestore `users` collection — Photo, Magozi ID, Location & registrationDate"
        />

        <div className="p-3 md:p-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Magozi ID, Name, Email, Phone, or Location..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Registered App Users: <span className="text-slate-900 dark:text-white font-extrabold">{users.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-400">
                    <th className="py-4 px-5">User Profile & Magozi ID</th>
                    <th className="py-4 px-5">Contact Details</th>
                    <th className="py-4 px-5">Location & Delivery Addresses</th>
                    <th className="py-4 px-5">Registration Date</th>
                    <th className="py-4 px-5">Role Permission</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        {/* Profile Picture, Name, Magozi ID */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {u.photoUrl ? (
                              <img 
                                src={u.photoUrl} 
                                alt={u.fullName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-magozi-800 dark:text-emerald-300 font-extrabold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800 flex-shrink-0 shadow-xs">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{u.fullName}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-mono font-bold flex items-center gap-1">
                                  <Hash size={10} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>{u.magoziId || u.id}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-4 px-5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{u.email}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{u.phone}</p>
                        </td>

                        {/* Location & Delivery Addresses */}
                        <td className="py-4 px-5 max-w-xs">
                          {u.location ? (
                            <div>
                              <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                                <MapPin size={14} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2 text-xs leading-relaxed font-medium">{u.location}</span>
                              </div>
                              {u.deliveryAddresses && u.deliveryAddresses.length > 1 && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  +{u.deliveryAddresses.length - 1} more addresses
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-400 italic text-[11px]">No location saved</span>
                          )}
                        </td>

                        {/* Registration Date */}
                        <td className="py-4 px-5 text-slate-600 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0" />
                            <span>{u.registrationDate || u.registeredDate || u.createdAt || "N/A"}</span>
                          </div>
                        </td>

                        {/* Role Permission */}
                        <td className="py-4 px-5">
                          <button
                            onClick={() => handleToggleAdminRole(u)}
                            className={`px-3 py-1 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 ${
                              u.role === "admin"
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-800 dark:hover:text-rose-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 dark:hover:text-emerald-300"
                            }`}
                            title="Click to toggle Admin permissions in Firestore `admins` collection"
                          >
                            {u.role === "admin" ? (
                              <>
                                <ShieldCheck size={14} className="text-emerald-700 dark:text-emerald-400" />
                                <span>ADMINISTRATOR</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert size={14} className="text-slate-400" />
                                <span>CUSTOMER USER</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right space-x-1">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-magozi-800 dark:hover:text-white hover:bg-magozi-50 dark:hover:bg-slate-800 transition"
                            title="Open User Detail Drawer"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete user "${u.fullName}" from Cloud Firestore?`)) {
                                handleDeleteUser(u.id);
                              }
                            }}
                            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Delete User from Firestore"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                        No users found in Cloud Firestore <code className="font-mono text-slate-400 font-bold">users</code> collection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <UserDetailDrawer
        isOpen={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onToggleAdminRole={handleToggleAdminRole}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}

