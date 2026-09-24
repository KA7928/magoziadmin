"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MetricCard from "@/components/MetricCard";
import OrderDetailModal from "@/components/OrderDetailModal";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { db, collection, onSnapshot, doc, updateDoc } from "@/lib/firebase";
import Link from "next/link";
import { 
  IndianRupee, 
  ShoppingBag, 
  Clock, 
  Users, 
  PlusCircle, 
  BellRing, 
  Sliders, 
  ArrowRight, 
  Truck,
  TrendingUp,
  PackageCheck,
  Calendar
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [revenueTimeframe, setRevenueTimeframe] = useState<"today" | "7days" | "30days" | "365days" | "lifetime">("today");

  // Realtime Listeners on Cloud Firestore — 100% Real Data
  useEffect(() => {
    try {
      const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
        const list: Order[] = snapshot.docs.map((d) => ({
          id: d.id.startsWith("#") ? d.id : `#${d.id}`,
          ...d.data(),
        } as Order));
        setOrders(list);
      }, (err) => console.warn("Orders listener warning:", err));

      const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setUserCount(snapshot.size);
      }, (err) => console.warn("Users listener warning:", err));

      const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        setProductCount(snapshot.size);
      }, (err) => console.warn("Products listener warning:", err));

      return () => {
        unsubOrders();
        unsubUsers();
        unsubProducts();
      };
    } catch (e) {
      console.warn("Firestore connection warning:", e);
    }
  }, []);

  const currentDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isWithinTimeframe = (createdAtStr?: string, timeframe: "today" | "7days" | "30days" | "365days" | "lifetime" = "today") => {
    if (timeframe === "lifetime") return true;
    if (!createdAtStr) return false;
    try {
      const orderDate = new Date(createdAtStr);
      if (isNaN(orderDate.getTime())) return false;
      const now = new Date();
      if (timeframe === "today") {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      const diffInMs = now.getTime() - orderDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      if (timeframe === "7days") return diffInDays <= 7;
      if (timeframe === "30days") return diffInDays <= 30;
      if (timeframe === "365days") return diffInDays <= 365;
      return true;
    } catch {
      return false;
    }
  };

  // Compute Strictly Real Metrics based on timeframe
  const filteredOrders = orders.filter((o) => isWithinTimeframe(o.createdAt, revenueTimeframe));
  const timeframeRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
    0
  );
  const timeframeOrdersCount = filteredOrders.length;

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
    0
  );
  const totalOrdersCount = orders.length;
  const activePendingOrders = orders.filter((o) =>
    ["PLACED", "PACKING", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  // Dynamically compute real-time chart data based on revenueTimeframe
  const getChartData = () => {
    const now = new Date();

    if (revenueTimeframe === "today") {
      const timeSlots = [
        { label: "12 AM", startHour: 0, endHour: 3 },
        { label: "3 AM", startHour: 3, endHour: 6 },
        { label: "6 AM", startHour: 6, endHour: 9 },
        { label: "9 AM", startHour: 9, endHour: 12 },
        { label: "12 PM", startHour: 12, endHour: 15 },
        { label: "3 PM", startHour: 15, endHour: 18 },
        { label: "6 PM", startHour: 18, endHour: 21 },
        { label: "9 PM", startHour: 21, endHour: 24 },
      ];

      const todayOrders = orders.filter((o) => {
        if (!o.createdAt) return false;
        try {
          const d = new Date(o.createdAt);
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        } catch {
          return false;
        }
      });

      return timeSlots.map((slot) => {
        const slotOrders = todayOrders.filter((o) => {
          try {
            const hour = new Date(o.createdAt!).getHours();
            return hour >= slot.startHour && hour < slot.endHour;
          } catch {
            return false;
          }
        });
        const revenue = slotOrders.reduce(
          (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
          0
        );
        return {
          day: slot.label,
          revenue,
          orders: slotOrders.length,
        };
      });
    } else if (revenueTimeframe === "7days") {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const isToday = i === 0;
        const dayLabel = isToday
          ? "Today"
          : d.toLocaleDateString("en-US", { weekday: "short" });

        const dayOrders = orders.filter((o) => {
          if (!o.createdAt) return false;
          try {
            const od = new Date(o.createdAt);
            return (
              od.getDate() === d.getDate() &&
              od.getMonth() === d.getMonth() &&
              od.getFullYear() === d.getFullYear()
            );
          } catch {
            return false;
          }
        });

        const revenue = dayOrders.reduce(
          (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
          0
        );
        days.push({
          day: dayLabel,
          revenue,
          orders: dayOrders.length,
        });
      }
      return days;
    } else if (revenueTimeframe === "30days") {
      const periods = [];
      for (let i = 29; i >= 0; i -= 5) {
        const dEnd = new Date();
        dEnd.setDate(now.getDate() - Math.max(0, i - 4));
        const dStart = new Date();
        dStart.setDate(now.getDate() - i);

        const dayLabel = `${dStart.getDate()}/${dStart.getMonth() + 1}`;

        const periodOrders = orders.filter((o) => {
          if (!o.createdAt) return false;
          try {
            const od = new Date(o.createdAt);
            return od >= dStart && od <= dEnd;
          } catch {
            return false;
          }
        });

        const revenue = periodOrders.reduce(
          (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
          0
        );
        periods.push({
          day: dayLabel,
          revenue,
          orders: periodOrders.length,
        });
      }
      return periods;
    } else {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

        const monthOrders = orders.filter((o) => {
          if (!o.createdAt) return false;
          try {
            const od = new Date(o.createdAt);
            return (
              od.getMonth() === d.getMonth() &&
              od.getFullYear() === d.getFullYear()
            );
          } catch {
            return false;
          }
        });

        const revenue = monthOrders.reduce(
          (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
          0
        );
        months.push({
          day: monthLabel,
          revenue,
          orders: monthOrders.length,
        });
      }
      return months;
    }
  };

  const realChartData = getChartData();

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const cleanId = orderId.replace("#", "");
    try {
      await updateDoc(doc(db, "orders", cleanId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating order status in Firestore:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Realtime Dashboard Overview"
          subtitle="Directly connected to Firebase — Displaying strictly real app data"
        />

        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
          {/* Quick Actions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Management Actions
            </span>
            <div className="flex items-center flex-wrap gap-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white text-xs font-bold transition shadow-sm"
              >
                <PlusCircle size={15} />
                <span>Add Product</span>
              </Link>

              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                <BellRing size={15} />
                <span>Send FCM Push</span>
              </Link>

              <Link
                href="/app-config"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Sliders size={15} />
                <span>Change App Charges</span>
              </Link>

              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Truck size={15} />
                <span>Manage Active Orders ({activePendingOrders.length})</span>
              </Link>
            </div>
          </div>

          {/* Current Date & Day + Revenue Timeframe Filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-magozi-800 text-white shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Today's Date & Day</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{currentDateString}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Revenue Timeframe:</span>
              {[
                { id: "today", label: "Today" },
                { id: "7days", label: "7 Days" },
                { id: "30days", label: "30 Days" },
                { id: "365days", label: "365 Days" },
                { id: "lifetime", label: "Lifetime" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setRevenueTimeframe(tf.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                    revenueTimeframe === tf.id
                      ? "bg-magozi-800 text-white border-magozi-800 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strictly Real Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title={`Total Revenue (${revenueTimeframe.toUpperCase()})`}
              value={formatCurrency(timeframeRevenue)}
              subtitle={`${timeframeOrdersCount} order(s) • ${revenueTimeframe === "today" ? "Today" : revenueTimeframe}`}
              icon={IndianRupee}
              color="green"
            />
            <MetricCard
              title={`Total Orders (${revenueTimeframe.toUpperCase()})`}
              value={timeframeOrdersCount}
              subtitle={`Lifetime: ${totalOrdersCount} orders`}
              icon={ShoppingBag}
              color="blue"
            />
            <MetricCard
              title="Active Pending Deliveries"
              value={activePendingOrders.length}
              subtitle="Orders in PLACED, PACKING, OUT_FOR_DELIVERY"
              icon={Clock}
              color="amber"
            />
            <MetricCard
              title="Registered App Users"
              value={userCount}
              subtitle="Registered users in `users` collection"
              icon={Users}
              color="purple"
            />
          </div>

          {/* Strictly Real Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Real Sales Revenue (INR ₹)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {revenueTimeframe === "today"
                      ? "Hourly breakdown of Today's customer orders in Cloud Firestore"
                      : `${revenueTimeframe.toUpperCase()} breakdown of actual customer orders in Firestore`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  <TrendingUp size={14} />
                  <span>Realtime Database Sync</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0F172A", color: "#F8FAFC" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2E7D32"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Real Orders Volume</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {revenueTimeframe === "today" ? "Today's hourly order volume" : `Order count by ${revenueTimeframe}`}
                </p>

                <div className="h-60 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#0F172A", color: "#F8FAFC" }} />
                      <Bar dataKey="orders" fill="#00C853" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Products Catalog: <strong className="text-slate-900 dark:text-white">{productCount} items</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Cloud Firestore Live</span>
              </div>
            </div>
          </div>

          {/* Active Orders Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Active Deliveries Pending Dispatch</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live sync with Android app 5-step order tracker</p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-bold text-magozi-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View All Orders ({orders.length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {activePendingOrders.length > 0 ? (
                    activePendingOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{ord.id}</td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{ord.customerName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{ord.phone}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 dark:text-slate-300">
                            {ord.items ? ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") : "N/A"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              ord.status === "PLACED"
                                ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300"
                                : ord.status === "PACKING"
                                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                                : "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300"
                            }`}
                          >
                            {ord.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1.5 rounded-lg bg-magozi-50 dark:bg-emerald-950/60 text-magozi-800 dark:text-emerald-300 hover:bg-magozi-100 dark:hover:bg-emerald-900/60 font-bold transition text-xs"
                          >
                            Dispatch Stepper
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                        No active pending orders in Cloud Firestore <code className="font-mono text-slate-600 dark:text-slate-400 font-bold">orders</code> collection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <OrderDetailModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
      />
    </div>
  );
}
