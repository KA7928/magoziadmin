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
  PackageCheck
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

  // Compute Strictly Real Metrics
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.status !== "CANCELLED" ? (Number(o.totalAmount) || 0) : 0),
    0
  );
  const totalOrdersCount = orders.length;
  const activePendingOrders = orders.filter((o) =>
    ["PLACED", "PACKING", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  // Calculate real daily sales trends from actual Firestore orders
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const realChartData = weekDays.map((day, idx) => {
    const dayOrders = orders.filter((o) => {
      if (!o.createdAt) return false;
      try {
        return new Date(o.createdAt).getDay() === idx;
      } catch {
        return false;
      }
    });
    const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return { day, revenue, orders: dayOrders.length };
  });

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
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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

          {/* Strictly Real Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              subtitle="Calculated from active Firestore orders"
              icon={IndianRupee}
              color="green"
            />
            <MetricCard
              title="Total Orders"
              value={totalOrdersCount}
              subtitle="Real orders in `orders` collection"
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
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Real Sales Revenue (INR ₹)</h3>
                  <p className="text-xs text-slate-500">Weekly breakdown of actual customer orders in Firestore</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #CBD5E1" }}
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

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Real Orders Volume</h3>
                <p className="text-xs text-slate-500">Order count by day of week</p>

                <div className="h-60 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={realChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #CBD5E1" }} />
                      <Bar dataKey="orders" fill="#00C853" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Products Catalog: <strong className="text-slate-900">{productCount} items</strong></span>
                <span className="text-emerald-600 font-bold">Cloud Firestore Live</span>
              </div>
            </div>
          </div>

          {/* Active Orders Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Active Deliveries Pending Dispatch</h3>
                <p className="text-xs text-slate-500">Live sync with Android app 5-step order tracker</p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-bold text-magozi-800 hover:text-magozi-900 flex items-center gap-1"
              >
                <span>View All Orders ({orders.length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {activePendingOrders.length > 0 ? (
                    activePendingOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{ord.id}</td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900">{ord.customerName}</p>
                            <p className="text-[11px] text-slate-500">{ord.phone}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600">
                            {ord.items ? ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") : "N/A"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              ord.status === "PLACED"
                                ? "bg-blue-100 text-blue-800"
                                : ord.status === "PACKING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {ord.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1.5 rounded-lg bg-magozi-50 text-magozi-800 hover:bg-magozi-100 font-bold transition text-xs"
                          >
                            Dispatch Stepper
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No active pending orders in Cloud Firestore <code className="font-mono text-slate-600 font-bold">orders</code> collection.
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
