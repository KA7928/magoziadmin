"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Seller, Superstore } from "@/lib/types";
import { 
  db, 
  storage, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  arrayUnion,
  arrayRemove,
  getDoc
} from "@/lib/firebase";
import { 
  UserCheck, 
  Users, 
  Search, 
  Plus, 
  Store, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  Play, 
  BellRing, 
  PackageCheck, 
  Calendar, 
  Filter, 
  X, 
  ImageIcon, 
  Sparkles, 
  UserX,
  ExternalLink
} from "lucide-react";

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stores, setStores] = useState<Superstore[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [savingSeller, setSavingSeller] = useState(false);
  const [deleteConfirmSeller, setDeleteConfirmSeller] = useState<Seller | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formFullName, setFormFullName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");
  const [formAge, setFormAge] = useState<number | string>(25);
  const [formImage, setFormImage] = useState("");
  const [formAssignedStoreId, setFormAssignedStoreId] = useState("");
  const [formTotalOrderAcceptances, setFormTotalOrderAcceptances] = useState<number | string>(0);
  const [formPhoneRingCount, setFormPhoneRingCount] = useState<number | string>(0);
  const [formIsApproved, setFormIsApproved] = useState(true);
  const [formIsStopped, setFormIsStopped] = useState(false);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // 1. Realtime listener for `sellers` collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "sellers"), (snap) => {
        // Exclude internal verification document "sellerListVerified" so it never appears on the website
        const sellerDocs = snap.docs.filter(
          (d) => d.id !== "sellerListVerified" && d.id.toLowerCase() !== "sellerlistverified"
        );
        const verifiedDoc = snap.docs.find(
          (d) => d.id === "sellerListVerified" || d.id.toLowerCase() === "sellerlistverified"
        );

        const list: Seller[] = sellerDocs.map((d) => {
          const data = d.data();
          const docId = d.id;
          const username = data.username || docId;
          const fullName = data.fullName || data.name || username;
          const email = data.email || "";
          const phoneNumber = data.phoneNumber || data.phone || "";
          const age = Number(data.age) || 0;
          const image = data.image || data.photoUrl || "";
          const assignedStoreId = data.assignedStoreId || data.storeId || "";
          const assignedStoreName = data.assignedStoreName || data.storeName || "";
          const totalOrderAcceptances = Number(data.totalOrderAcceptances ?? data.total_order_acceptances ?? 0);
          const phoneRingCount = Number(data.phoneRingCount ?? data.phone_ring_count ?? 0);
          const isApproved = Boolean(data.isApproved ?? (data.status === "approved"));
          const isStopped = Boolean(data.isStopped ?? (data.status === "stopped"));

          return {
            id: docId,
            username,
            fullName,
            email,
            phoneNumber,
            age,
            image,
            assignedStoreId,
            assignedStoreName,
            totalOrderAcceptances,
            phoneRingCount,
            isApproved,
            isStopped,
            status: isStopped ? "stopped" : isApproved ? "approved" : "pending",
            createdAt: data.createdAt || "",
            updatedAt: data.updatedAt || "",
            lastUpdated: data.lastUpdated || 0,
          };
        });

        setSellers(list);
        setLoading(false);

        // Keep "sellerListVerified" document in sync with the array of all valid seller emails
        const storedEmails: string[] = verifiedDoc?.data()?.emailsOfSeller || [];

        const currentActiveEmails = Array.from(
          new Set(
            list
              .map((s) => s.email?.trim().toLowerCase())
              .filter((em): em is string => Boolean(em && em.length > 0))
          )
        );

        const isOutOfSync =
          !verifiedDoc ||
          currentActiveEmails.length !== storedEmails.length ||
          currentActiveEmails.some((em) => !storedEmails.includes(em));

        if (isOutOfSync) {
          setDoc(
            doc(db, "sellers", "sellerListVerified"),
            {
              emailsOfSeller: currentActiveEmails,
            },
            { merge: true }
          ).catch((e) => console.warn("Notice syncing sellerListVerified:", e));
        }
      }, (err) => {
        console.warn("Firestore sellers listener warning:", err);
        setLoading(false);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to sellers in Firestore:", e);
      setLoading(false);
    }
  }, []);

  // 2. Realtime listener for `stores` collection to assign sellers
  useEffect(() => {
    try {
      const unsubStores = onSnapshot(collection(db, "stores"), (snap) => {
        const list: Superstore[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || data.branchName || `Store (${d.id})`,
            location: data.location || data.address || "",
            imageUrl: data.imageUrl || data.image || "",
            isOpen: Boolean(data.isOpen ?? true),
          };
        });
        setStores(list);
      }, (err) => {
        console.warn("Firestore stores listener warning:", err);
      });

      return () => unsubStores();
    } catch (e) {
      console.warn("Error subscribing to stores in Firestore:", e);
    }
  }, []);

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingSeller(null);
    setFormFullName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhoneNumber("");
    setFormAge(25);
    setFormImage("");
    setFormAssignedStoreId(stores.length > 0 ? stores[0].id : "");
    setFormTotalOrderAcceptances(0);
    setFormPhoneRingCount(0);
    setFormIsApproved(true);
    setFormIsStopped(false);
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (seller: Seller) => {
    setEditingSeller(seller);
    setFormFullName(seller.fullName);
    setFormUsername(seller.username);
    setFormEmail(seller.email);
    setFormPhoneNumber(seller.phoneNumber);
    setFormAge(seller.age || 25);
    setFormImage(seller.image || "");
    setFormAssignedStoreId(seller.assignedStoreId || "");
    setFormTotalOrderAcceptances(seller.totalOrderAcceptances || 0);
    setFormPhoneRingCount(seller.phoneRingCount || 0);
    setFormIsApproved(seller.isApproved);
    setFormIsStopped(seller.isStopped);
    setModalOpen(true);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("error", "Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `sellers/${timestamp}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setFormImage(downloadURL);
      showNotification("success", "Seller photo uploaded successfully!");
    } catch (err: any) {
      console.error("Error uploading seller photo:", err);
      showNotification("error", err.message || "Failed to upload image to Firebase Storage.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Seller Handler (Create or Update in Firestore collection "sellers", document ID = username)
  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = formUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (!cleanUsername) {
      showNotification("error", "Seller username is required and will be used as the document ID.");
      return;
    }

    if (cleanUsername === "sellerlistverified" || cleanUsername === "seller_list_verified") {
      showNotification("error", "Username 'sellerListVerified' is a reserved verification ID. Please choose another username.");
      return;
    }

    if (!formFullName.trim()) {
      showNotification("error", "Seller full name is required.");
      return;
    }

    setSavingSeller(true);

    try {
      // Find assigned store name
      const matchedStore = stores.find((s) => s.id === formAssignedStoreId);
      const assignedStoreName = matchedStore ? (matchedStore.name || matchedStore.id) : "";

      const ageNum = Number(formAge) >= 0 ? Number(formAge) : 25;
      const orderAcceptancesNum = Number(formTotalOrderAcceptances) >= 0 ? Number(formTotalOrderAcceptances) : 0;
      const ringCountNum = Number(formPhoneRingCount) >= 0 ? Number(formPhoneRingCount) : 0;

      const payload = {
        username: cleanUsername,
        fullName: formFullName.trim(),
        name: formFullName.trim(),
        email: formEmail.trim(),
        phoneNumber: formPhoneNumber.trim(),
        phone: formPhoneNumber.trim(),
        age: ageNum,
        image: formImage.trim(),
        photoUrl: formImage.trim(),
        assignedStoreId: formAssignedStoreId,
        storeId: formAssignedStoreId,
        assignedStoreName: assignedStoreName,
        storeName: assignedStoreName,
        totalOrderAcceptances: orderAcceptancesNum,
        total_order_acceptances: orderAcceptancesNum,
        phoneRingCount: ringCountNum,
        phone_ring_count: ringCountNum,
        isApproved: Boolean(formIsApproved),
        isStopped: Boolean(formIsStopped),
        status: formIsStopped ? "stopped" : formIsApproved ? "approved" : "pending",
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
        createdAt: editingSeller?.createdAt || new Date().toISOString(),
      };

      // Document ID in Firestore is seller username
      const docRef = doc(db, "sellers", cleanUsername);
      await setDoc(docRef, payload, { merge: true });

      // If editing and username changed, remove the old document ID
      if (editingSeller && editingSeller.username !== cleanUsername) {
        await deleteDoc(doc(db, "sellers", editingSeller.username));
      }

      // Sync seller email into "sellerListVerified" -> "emailsOfSeller" array
      const cleanEmail = formEmail.trim().toLowerCase();
      const oldEmail = editingSeller?.email ? editingSeller.email.trim().toLowerCase() : "";

      if (oldEmail && oldEmail !== cleanEmail) {
        await setDoc(
          doc(db, "sellers", "sellerListVerified"),
          {
            emailsOfSeller: arrayRemove(oldEmail),
          },
          { merge: true }
        ).catch((e) => console.warn("Error removing old email from sellerListVerified:", e));
      }

      if (cleanEmail) {
        await setDoc(
          doc(db, "sellers", "sellerListVerified"),
          {
            emailsOfSeller: arrayUnion(cleanEmail),
          },
          { merge: true }
        ).catch((e) => console.warn("Error adding email to sellerListVerified:", e));
      }

      showNotification("success", `Seller @${cleanUsername} saved successfully in Firestore ("sellers" collection)!`);
      setModalOpen(false);
      setEditingSeller(null);
    } catch (err: any) {
      console.error("Error saving seller:", err);
      showNotification("error", err.message || "Failed to save seller to Firestore.");
    } finally {
      setSavingSeller(false);
    }
  };

  // 1-Click Approve / Disapprove Seller
  const handleToggleApprove = async (seller: Seller) => {
    try {
      const nextApproved = !seller.isApproved;
      const nextStatus = seller.isStopped ? "stopped" : nextApproved ? "approved" : "pending";

      await setDoc(
        doc(db, "sellers", seller.username),
        {
          isApproved: nextApproved,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          lastUpdated: Date.now(),
        },
        { merge: true }
      );

      showNotification(
        "success",
        nextApproved 
          ? `Seller @${seller.username} has been APPROVED!` 
          : `Seller @${seller.username} approval revoked (PENDING).`
      );
    } catch (err: any) {
      console.error("Error toggling approval:", err);
      showNotification("error", err.message || "Failed to update approval status.");
    }
  };

  // 1-Click Stop / Activate Seller
  const handleToggleStop = async (seller: Seller) => {
    try {
      const nextStopped = !seller.isStopped;
      const nextStatus = nextStopped ? "stopped" : seller.isApproved ? "approved" : "active";

      await setDoc(
        doc(db, "sellers", seller.username),
        {
          isStopped: nextStopped,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          lastUpdated: Date.now(),
        },
        { merge: true }
      );

      showNotification(
        "success",
        nextStopped 
          ? `Seller @${seller.username} is now STOPPED from accepting orders.` 
          : `Seller @${seller.username} has been RESUMED and is now ACTIVE!`
      );
    } catch (err: any) {
      console.error("Error toggling stopped status:", err);
      showNotification("error", err.message || "Failed to update seller active state.");
    }
  };

  // Delete Seller Handler
  const handleDeleteSeller = async () => {
    if (!deleteConfirmSeller) return;
    setDeleting(true);

    try {
      await deleteDoc(doc(db, "sellers", deleteConfirmSeller.username));

      // Remove seller's email from "sellerListVerified" -> "emailsOfSeller" array
      if (deleteConfirmSeller.email && deleteConfirmSeller.email.trim()) {
        const emailToRemove = deleteConfirmSeller.email.trim().toLowerCase();
        await setDoc(
          doc(db, "sellers", "sellerListVerified"),
          {
            emailsOfSeller: arrayRemove(emailToRemove),
          },
          { merge: true }
        ).catch((e) => console.warn("Error removing email from sellerListVerified:", e));
      }

      showNotification("success", `Seller @${deleteConfirmSeller.username} permanently deleted from Firestore.`);
      setDeleteConfirmSeller(null);
    } catch (err: any) {
      console.error("Error deleting seller:", err);
      showNotification("error", err.message || "Failed to delete seller.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Sellers Computation
  const filteredSellers = sellers.filter((seller) => {
    if (seller.id === "sellerListVerified" || seller.username.toLowerCase() === "sellerlistverified") {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = 
      !q || 
      seller.fullName.toLowerCase().includes(q) ||
      seller.username.toLowerCase().includes(q) ||
      seller.email.toLowerCase().includes(q) ||
      seller.phoneNumber.toLowerCase().includes(q) ||
      (seller.assignedStoreName && seller.assignedStoreName.toLowerCase().includes(q));

    const matchStore = 
      selectedStoreFilter === "all" || 
      seller.assignedStoreId === selectedStoreFilter;

    const matchApproval = 
      selectedApprovalFilter === "all" || 
      (selectedApprovalFilter === "approved" && seller.isApproved) ||
      (selectedApprovalFilter === "pending" && !seller.isApproved);

    const matchStatus = 
      selectedStatusFilter === "all" || 
      (selectedStatusFilter === "active" && !seller.isStopped) ||
      (selectedStatusFilter === "stopped" && seller.isStopped);

    return matchQuery && matchStore && matchApproval && matchStatus;
  });

  // Analytics Metrics
  const totalSellersCount = sellers.length;
  const approvedSellersCount = sellers.filter((s) => s.isApproved && !s.isStopped).length;
  const stoppedSellersCount = sellers.filter((s) => s.isStopped).length;
  const pendingSellersCount = sellers.filter((s) => !s.isApproved).length;
  const totalOrdersAcceptedSum = sellers.reduce((acc, s) => acc + (s.totalOrderAcceptances || 0), 0);
  const totalRingsSum = sellers.reduce((acc, s) => acc + (s.phoneRingCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-16 w-full overflow-x-hidden">
        <Header 
          title="Sellers Management" 
          subtitle="Manage, approve, assign stores, and monitor sellers in realtime (Firestore `sellers` collection)"
        />

        <div className="p-4 md:p-8 space-y-6">
          {/* Notification Toast */}
          {notification && (
            <div className={`p-4 rounded-2xl text-xs font-bold shadow-xl flex items-center justify-between animate-in fade-in ${
              notification.type === "success" 
                ? "bg-emerald-600 text-white" 
                : "bg-rose-600 text-white"
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="p-1 rounded-lg hover:bg-white/20 transition"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Top Analytics Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {/* 1. Total Sellers */}
            <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                <Users size={22} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Sellers</span>
                <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{totalSellersCount}</span>
              </div>
            </div>

            {/* 2. Approved Sellers */}
            <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Approved & Active</span>
                <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedSellersCount}</span>
              </div>
            </div>

            {/* 3. Stopped Sellers */}
            <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold flex-shrink-0">
                <Ban size={22} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Stopped Sellers</span>
                <span className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400">{stoppedSellersCount}</span>
              </div>
            </div>

            {/* 4. Total Order Acceptances */}
            <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold flex-shrink-0">
                <PackageCheck size={22} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Acceptances</span>
                <span className="text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400">{totalOrdersAcceptedSum}</span>
              </div>
            </div>

            {/* 5. Total Phone Ring Count */}
            <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                <BellRing size={22} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Phone Rings</span>
                <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">{totalRingsSum}</span>
              </div>
            </div>
          </div>

          {/* Search, Filter Bar and Add Seller Button */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sellers by name, username, email, phone, or store..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800 transition"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Action: Add Seller Button */}
              <button 
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-2xl bg-magozi-800 hover:bg-magozi-900 text-white font-extrabold text-xs shadow-md shadow-magozi-800/20 transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Plus size={16} />
                <span>Add New Seller</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Filter size={13} /> Filters:
              </span>

              {/* Store Filter */}
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">🏪 All Stores ({stores.length})</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.id}
                  </option>
                ))}
              </select>

              {/* Approval Filter */}
              <select
                value={selectedApprovalFilter}
                onChange={(e) => setSelectedApprovalFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">🛡️ All Approval</option>
                <option value="approved">✅ Approved Sellers</option>
                <option value="pending">⏳ Pending Approval</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">⚡ All Status</option>
                <option value="active">🟢 Active Sellers</option>
                <option value="stopped">🔴 Stopped / Paused</option>
              </select>

              {(selectedStoreFilter !== "all" || selectedApprovalFilter !== "all" || selectedStatusFilter !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedStoreFilter("all");
                    setSelectedApprovalFilter("all");
                    setSelectedStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-rose-600 transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Sellers Table & Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={18} className="text-magozi-800 dark:text-emerald-400" />
                  <span>Sellers Directory ({filteredSellers.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Firestore collection: <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">sellers</code> • Document ID = Seller Username
                </p>
              </div>

              {loading && <RefreshCw size={16} className="animate-spin text-slate-400" />}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Seller Info</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-3">Age</th>
                    <th className="py-3.5 px-4">Assigned Store</th>
                    <th className="py-3.5 px-3 text-center">Orders Accepted</th>
                    <th className="py-3.5 px-3 text-center">Ring Count</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSellers.map((seller) => {
                    const assignedStore = stores.find((s) => s.id === seller.assignedStoreId);

                    return (
                      <tr 
                        key={seller.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          seller.isStopped ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                        }`}
                      >
                        {/* Seller Avatar, Name, Username */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                              {seller.image ? (
                                <img 
                                  src={seller.image} 
                                  alt={seller.fullName} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <Users size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                {seller.fullName}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-magozi-800 dark:text-emerald-400 block">
                                @{seller.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3.5 px-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{seller.email || "No email"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Phone size={12} className="text-slate-400 flex-shrink-0" />
                            <a 
                              href={seller.phoneNumber ? `tel:${seller.phoneNumber}` : undefined} 
                              className="font-mono font-medium hover:underline text-blue-600 dark:text-blue-400"
                            >
                              {seller.phoneNumber || "No phone"}
                            </a>
                          </div>
                        </td>

                        {/* Age */}
                        <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {seller.age ? `${seller.age} yrs` : "—"}
                        </td>

                        {/* Assigned Store */}
                        <td className="py-3.5 px-4">
                          {assignedStore ? (
                            <div className="flex items-center gap-1.5">
                              <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <Store size={13} />
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={assignedStore.name}>
                                {assignedStore.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Total Order Acceptances */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs">
                            <PackageCheck size={12} />
                            {seller.totalOrderAcceptances || 0}
                          </span>
                        </td>

                        {/* Phone Ring Count */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-xs">
                            <BellRing size={12} />
                            {seller.phoneRingCount || 0}
                          </span>
                        </td>

                        {/* Status (Approved & Active/Stopped) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {/* Approved Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              seller.isApproved 
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" 
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                            }`}>
                              {seller.isApproved ? "Approved" : "Pending"}
                            </span>

                            {/* Stopped Badge */}
                            {seller.isStopped && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                Stopped
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve / Disapprove Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleApprove(seller)}
                              className={`p-1.5 rounded-xl border transition ${
                                seller.isApproved
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
                              }`}
                              title={seller.isApproved ? "Revoke Approval" : "Approve Seller"}
                            >
                              <ShieldCheck size={14} />
                            </button>

                            {/* Stop / Resume Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStop(seller)}
                              className={`p-1.5 rounded-xl border transition ${
                                seller.isStopped
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 border-rose-300 dark:border-rose-800 hover:bg-emerald-50 hover:text-emerald-600"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                              }`}
                              title={seller.isStopped ? "Resume Seller" : "Stop Seller"}
                            >
                              {seller.isStopped ? <Play size={14} /> : <Ban size={14} />}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(seller)}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
                              title="Edit Seller Details"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSeller(seller)}
                              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition"
                              title="Delete Seller"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSellers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-extrabold text-sm">No sellers found</p>
                        <p className="text-xs text-slate-500 mt-1">Try clearing filters or add a new seller above.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Card View */}
            <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSellers.map((seller) => {
                const assignedStore = stores.find((s) => s.id === seller.assignedStoreId);

                return (
                  <div
                    key={seller.id}
                    className={`p-4 rounded-3xl border transition space-y-3.5 bg-slate-50/70 dark:bg-slate-900/60 ${
                      seller.isStopped 
                        ? "border-rose-300 dark:border-rose-900/60" 
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {seller.image ? (
                            <img src={seller.image} alt={seller.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <Users size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white text-sm">{seller.fullName}</h4>
                          <span className="font-mono text-xs font-bold text-magozi-800 dark:text-emerald-400 block">
                            @{seller.username}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Age: {seller.age || "—"} yrs</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          seller.isApproved 
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" 
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                        }`}>
                          {seller.isApproved ? "Approved" : "Pending"}
                        </span>
                        {seller.isStopped && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                            Stopped
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contacts & Assigned Store */}
                    <div className="text-xs space-y-1.5 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Store:</span>
                        <span className="font-bold truncate max-w-[170px]">
                          {assignedStore ? `🏪 ${assignedStore.name}` : "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Email:</span>
                        <span className="truncate max-w-[170px]">{seller.email || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Phone:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {seller.phoneNumber || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/40">
                        <span className="text-[9px] uppercase font-extrabold text-purple-600 dark:text-purple-400 block">Orders Accepted</span>
                        <span className="font-black text-sm text-purple-700 dark:text-purple-300">
                          {seller.totalOrderAcceptances || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40">
                        <span className="text-[9px] uppercase font-extrabold text-amber-600 dark:text-amber-400 block">Phone Rings</span>
                        <span className="font-black text-sm text-amber-700 dark:text-amber-300">
                          {seller.phoneRingCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Card Action Buttons */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleApprove(seller)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            seller.isApproved
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <ShieldCheck size={14} />
                          <span>{seller.isApproved ? "Approved" : "Approve"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStop(seller)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            seller.isStopped
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {seller.isStopped ? <Play size={14} /> : <Ban size={14} />}
                          <span>{seller.isStopped ? "Resume" : "Stop"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(seller)}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSeller(seller)}
                          className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSellers.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="font-extrabold text-sm">No sellers found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Add or Edit Seller */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="text-magozi-800 dark:text-emerald-400" size={20} />
                    <span>{editingSeller ? `Edit Seller: @${editingSeller.username}` : "Add New Seller"}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saved in Firestore collection <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">sellers</code> • Document ID: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">{formUsername || "{username}"}</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveSeller} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Seller Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                  </div>

                  {/* Username (Document ID) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center justify-between">
                      <span>Seller Username (Document ID) *</span>
                      <span className="text-[9px] text-purple-600 font-mono font-bold">Firestore Doc ID</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">@</span>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_"))}
                        placeholder="ramesh_kumar"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Seller Email Address
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="seller@magozi.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Seller Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formPhoneNumber}
                      onChange={(e) => setFormPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Seller Age (Years)
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={formAge}
                      onChange={(e) => setFormAge(e.target.value)}
                      placeholder="28"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                  </div>

                  {/* Store Assignment Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center justify-between">
                      <span>Assign Seller with Store</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Stores Synced</span>
                    </label>
                    <select
                      value={formAssignedStoreId}
                      onChange={(e) => setFormAssignedStoreId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    >
                      <option value="">🚫 Unassigned (No Store)</option>
                      {stores.map((st) => (
                        <option key={st.id} value={st.id}>
                          🏪 {st.name || st.id} {st.location ? `(${st.location})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Total Order Acceptances */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Total Order Acceptances
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formTotalOrderAcceptances}
                      onChange={(e) => setFormTotalOrderAcceptances(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                  </div>

                  {/* Phone Ring Count */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Seller Phone Ring Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formPhoneRingCount}
                      onChange={(e) => setFormPhoneRingCount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                  </div>
                </div>

                {/* Seller Image Upload & URL */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider block">
                    Seller Image / Profile Photo
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {formImage ? (
                        <img src={formImage} alt="Seller" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        {/* File Upload Button */}
                        <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1.5 flex-shrink-0">
                          {uploadingImage ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                          <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>

                        {/* Image URL Input */}
                        <input
                          type="url"
                          value={formImage}
                          onChange={(e) => setFormImage(e.target.value)}
                          placeholder="Or paste image URL (https://...)"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Upload profile photo to Firebase Storage (<code className="font-mono">sellers/</code> folder) or provide direct URL.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Toggles: Approved & Stopped */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Approval Toggle */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Seller Approval Status
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Approve seller to accept orders
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsApproved(!formIsApproved)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        formIsApproved
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {formIsApproved ? "APPROVED" : "PENDING"}
                    </button>
                  </div>

                  {/* Stop Seller Toggle */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Stop Seller (Pause)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Temporarily suspend order receiving
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsStopped(!formIsStopped)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                        formIsStopped
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {formIsStopped ? "STOPPED" : "ACTIVE"}
                    </button>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSeller}
                    className="px-6 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-extrabold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingSeller ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>{savingSeller ? "Saving..." : editingSeller ? "Update Seller" : "Create Seller"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Delete Seller */}
        {deleteConfirmSeller && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Delete Seller @{deleteConfirmSeller.username}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteConfirmSeller.fullName}</strong>? This action will permanently remove the document <code className="font-mono text-purple-600">sellers/{deleteConfirmSeller.username}</code> from Firestore.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmSeller(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSeller}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>{deleting ? "Deleting..." : "Permanently Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
