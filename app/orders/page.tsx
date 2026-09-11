"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import OrderDetailModal from "@/components/OrderDetailModal";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { db, collection, onSnapshot, doc, updateDoc, deleteDoc } from "@/lib/firebase";
import { 
  PackageCheck, 
  Search, 
  Clock, 
  Package, 
  Truck, 
  CheckCheck, 
  XCircle, 
  Filter,
  Eye,
  MapPin,
  Trash2,
  Pin,
  PinOff,
  ExternalLink,
  BellRing
} from "lucide-react";

const DELIVERY_STATUS_MAP: Record<OrderStatus, string> = {
  PLACED: "ORDER PLACED",
  PACKING: "ORDER PACKING",
  OUT_FOR_DELIVERY: "ORDER IS OUT FOR DELIVERY",
  AT_DOORSTEPS: "ORDER AT YOUR DOORSTEPS",
  DELIVERED: "ORDER DELIVERED",
  CANCELLED: "CANCELLED",
};

const FILTER_TABS: { label: string; value: string; icon: any }[] = [
  { label: "All Orders", value: "ALL", icon: Filter },
  { label: "Placed", value: "PLACED", icon: Clock },
  { label: "Packing", value: "PACKING", icon: Package },
  { label: "Out For Delivery", value: "OUT_FOR_DELIVERY", icon: Truck },
  { label: "At Doorsteps", value: "AT_DOORSTEPS", icon: MapPin },
  { label: "Delivered", value: "DELIVERED", icon: CheckCheck },
  { label: "Cancelled", value: "CANCELLED", icon: XCircle },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Firestore Realtime Listener for Orders
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
        const list: Order[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const rawId = docSnap.id;
          const formattedId = rawId.startsWith("#") ? rawId : `#${rawId}`;

          // Normalize Customer Name
          const customerName = d.customerName || d.customer_name || d.userName || d.user_name || d.name || "App Customer";

          // Normalize Phone & Contact Number
          const phone = d.phone || d.phoneNumber || d.phone_number || d.userPhone || d.user_phone || d.mobile || "N/A";
          const contactNumber = d.contactNumber || d.contact_number || d.contactPhone || d.contact_phone || phone;

          // Normalize Delivery Address & Location
          const address = d.address || d.deliveryAddress || d.delivery_address || d.shippingAddress || d.shipping_address || d.fullAddress || d.full_address || "N/A";
          const location = d.location || d.deliveryLocation || d.delivery_location || address;
          const latitude = d.latitude ? Number(d.latitude) : d.lat ? Number(d.lat) : undefined;
          const longitude = d.longitude ? Number(d.longitude) : d.lng ? Number(d.lng) : undefined;

          // Normalize Delivery Timing
          const deliveryTiming = d.deliveryTiming || d.delivery_timing || d.deliveryTime || d.delivery_time || d.estimatedDeliveryTime || "8 to 15 Mins";

          // Normalize Cart Items
          const rawItems = d.items || d.orderItems || d.order_items || d.cartItems || d.cart_items || d.products || [];
          const items = Array.isArray(rawItems)
            ? rawItems.map((item: any) => ({
                productId: item.productId || item.product_id || item.id || "prod",
                name: item.name || item.productName || item.product_name || item.title || "Grocery Item",
                price: Number(item.price || item.unitPrice || item.unit_price || 0),
                quantity: Number(item.quantity || item.qty || item.count || 1),
                unit: item.unit || item.quantityUnit || item.unit_type || "1 Pack",
                image: item.image || item.imageUrl || item.image_url || "",
              }))
            : [];

          // Normalize Delivery Fee / Charges
          const deliveryFee = Number(
            d.deliveryFee ?? d.delivery_fee ?? d.deliveryCharge ?? d.delivery_charge ?? d.shippingFee ?? d.shipping_fee ?? 0
          );

          // Normalize Discount
          const discount = Number(
            d.discount ?? d.discountAmount ?? d.discount_amount ?? d.couponDiscount ?? d.coupon_discount ?? d.savings ?? 0
          );

          // Normalize Total Amount
          const totalAmount = Number(
            d.totalAmount ?? d.total_amount ?? d.grandTotal ?? d.grand_total ?? d.amount ?? d.total ?? 0
          );

          // Normalize Payment Status
          const rawPayment = String(
            d.paymentStatus || d.payment_status || d.paymentMode || d.payment_mode || d.paymentMethod || d.payment_method || "COD"
          ).toUpperCase();
          const paymentStatus = rawPayment.includes("ONLINE") || rawPayment.includes("PAID") || rawPayment.includes("UPI") ? "ONLINE_PAID" : "COD";

          // Normalize Order Delivery Status & deliveryStatus
          const rawDelivery = String(d.deliveryStatus || d.delivery_status || "").toUpperCase();
          const rawStatus = String(d.status || d.orderStatus || d.order_status || "").toUpperCase();
          const combined = `${rawStatus} ${rawDelivery}`;

          let status: OrderStatus = "PLACED";
          if (combined.includes("DOORSTEP") || combined.includes("AT YOUR DOORSTEPS")) status = "AT_DOORSTEPS";
          else if (combined.includes("DELIVERED") || combined.includes("COMPLETED")) status = "DELIVERED";
          else if (combined.includes("PACK") || combined.includes("PREPAR")) status = "PACKING";
          else if (combined.includes("OUT") || combined.includes("DISPATCH") || combined.includes("SHIPPED")) status = "OUT_FOR_DELIVERY";
          else if (combined.includes("CANCEL") || combined.includes("REJECT")) status = "CANCELLED";
          else status = "PLACED";

          const deliveryStatus = DELIVERY_STATUS_MAP[status];
          const isPinned = Boolean(d.isPinned || d.is_pinned);
          const notifyuser = d.notifyuser || d.notifyUser || d.notify_user || "";

          // Normalize Timestamp
          let createdAt = d.createdAt || d.created_at || d.orderDate || d.order_date || d.timestamp;

          return {
            id: formattedId,
            customerName,
            phone,
            contactNumber,
            address,
            location,
            latitude,
            longitude,
            notifyuser,
            deliveryTiming,
            items,
            deliveryFee,
            discount,
            totalAmount,
            paymentStatus,
            status,
            deliveryStatus,
            isPinned,
            createdAt,
            ...d,
          } as Order;
        });

        setOrders(list);
      }, (err) => console.warn("Orders listener warning:", err));

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore listener error", e);
    }
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const cleanId = orderId.replace("#", "");
    const deliveryStatusStr = DELIVERY_STATUS_MAP[newStatus];

    try {
      await updateDoc(doc(db, "orders", cleanId), {
        status: newStatus,
        orderStatus: newStatus,
        order_status: newStatus,
        deliveryStatus: deliveryStatusStr,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, deliveryStatus: deliveryStatusStr });
      }
    } catch (err) {
      console.error("Error updating order status in Firestore:", err);
    }
  };

  const handleUpdateDeliveryTiming = async (orderId: string, newTiming: string) => {
    const cleanId = orderId.replace("#", "");
    try {
      await updateDoc(doc(db, "orders", cleanId), {
        deliveryTiming: newTiming,
        delivery_timing: newTiming,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, deliveryTiming: newTiming });
      }
    } catch (err) {
      console.error("Error updating deliveryTiming in Firestore:", err);
    }
  };

  const handleUpdateNotifyUser = async (orderId: string, message: string) => {
    const cleanId = orderId.replace("#", "");
    try {
      await updateDoc(doc(db, "orders", cleanId), {
        notifyuser: message,
        notifyUser: message,
        notify_user: message,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, notifyuser: message });
      }
    } catch (err) {
      console.error("Error updating notifyuser in Firestore:", err);
    }
  };

  const handleTogglePinOrder = async (orderId: string, currentPinned?: boolean) => {
    const cleanId = orderId.replace("#", "");
    const newPinned = !currentPinned;
    try {
      await updateDoc(doc(db, "orders", cleanId), {
        isPinned: newPinned,
        is_pinned: newPinned,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error toggling pin on order in Firestore:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderId} from Firestore?`)) return;
    const cleanId = orderId.replace("#", "");
    try {
      await deleteDoc(doc(db, "orders", cleanId));
    } catch (err) {
      console.error("Error deleting order from Firestore:", err);
    }
  };

  // Filter & Search Logic: Matches Order ID (#MAG...), Phone Number, Customer Name
  // Pinned orders are sorted to show at the VERY TOP!
  const filteredOrders = orders
    .filter((o) => {
      const matchesFilter = activeFilter === "ALL" || o.status === activeFilter;

      const q = searchQuery.trim().toLowerCase().replace("#", "");
      const cleanOrderId = (o.id || "").toLowerCase().replace("#", "");

      const matchesSearch =
        !q ||
        cleanOrderId.includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.phone && o.phone.toLowerCase().includes(q)) ||
        (o.contactNumber && o.contactNumber.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // 1. Pinned Orders come FIRST
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      if (bPinned !== aPinned) {
        return bPinned - aPinned;
      }
      // 2. Otherwise sort by newest date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Realtime Order Dispatch & Management"
          subtitle="Realtime Cloud Firestore collection `orders` — Sync status to Android App 5-step tracker"
        />

        <div className="p-3 md:p-6 space-y-6">
          {/* Filter Tabs & Search */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
                {FILTER_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const count =
                    tab.value === "ALL"
                      ? orders.length
                      : orders.filter((o) => o.status === tab.value).length;
                  const isActive = activeFilter === tab.value;

                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveFilter(tab.value)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        isActive
                          ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          isActive ? "bg-magozi-900 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID (#MAG...), Phone, or Name..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                    <th className="py-4 px-5">Order ID & Date</th>
                    <th className="py-4 px-5">Customer & Phone</th>
                    <th className="py-4 px-5">Delivery Address</th>
                    <th className="py-4 px-5">Items Breakdown</th>
                    <th className="py-4 px-5">Delivery & Discount</th>
                    <th className="py-4 px-5">Grand Total</th>
                    <th className="py-4 px-5">1-Click Status Stepper</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className={`transition ${
                          ord.isPinned ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-slate-900 text-sm">{ord.id}</p>
                            {ord.isPinned && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs">
                                📌 PINNED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(ord.createdAt)}</p>
                          {ord.notifyuser && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80 truncate max-w-[180px]">
                              <BellRing size={10} className="text-amber-700 flex-shrink-0" />
                              <span className="truncate" title={`notifyuser: ${ord.notifyuser}`}>{ord.notifyuser}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900">{ord.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{ord.contactNumber || ord.phone}</p>
                        </td>

                        <td className="py-4 px-5 max-w-xs">
                          <a
                            href={
                              ord.latitude && ord.longitude
                                ? `https://www.google.com/maps/search/?api=1&query=${ord.latitude},${ord.longitude}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ord.location, ord.address].filter(Boolean).join(", "))}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                            title="Click to Open in Google Maps 🗺️"
                          >
                            <p className="truncate text-slate-900 font-bold text-xs group-hover:text-magozi-800 group-hover:underline flex items-center gap-1">
                              <span>{ord.location || ord.address}</span>
                              <ExternalLink size={12} className="text-slate-400 group-hover:text-magozi-800 flex-shrink-0" />
                            </p>
                            {ord.location && ord.address !== ord.location && (
                              <p className="truncate text-slate-500 text-[11px] mt-0.5">{ord.address}</p>
                            )}
                          </a>
                        </td>

                        <td className="py-4 px-5 max-w-xs">
                          <span className="font-semibold text-slate-800 line-clamp-2">
                            {ord.items && ord.items.length > 0 ? ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") : "N/A"}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-slate-700">
                              Delivery: <strong className="text-slate-900">{ord.deliveryFee ? formatCurrency(ord.deliveryFee) : "FREE"}</strong>
                            </p>
                            {ord.discount ? (
                              <p className="text-[11px] font-bold text-emerald-600">
                                Discount: -{formatCurrency(ord.discount)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400">No Coupon</p>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <p className="font-extrabold text-magozi-900 text-sm">
                            {formatCurrency(ord.totalAmount)}
                          </p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {ord.paymentStatus}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold outline-none cursor-pointer border ${
                              ord.status === "PLACED"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : ord.status === "PACKING"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : ord.status === "OUT_FOR_DELIVERY"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : ord.status === "AT_DOORSTEPS"
                                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                : ord.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            <option value="PLACED">1. PLACED</option>
                            <option value="PACKING">2. PACKING</option>
                            <option value="OUT_FOR_DELIVERY">3. OUT FOR DELIVERY</option>
                            <option value="AT_DOORSTEPS">4. AT DOORSTEPS</option>
                            <option value="DELIVERED">5. DELIVERED</option>
                            <option value="CANCELLED">6. CANCELLED</option>
                          </select>
                        </td>

                        <td className="py-4 px-5 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleTogglePinOrder(ord.id, ord.isPinned)}
                            className={`p-2 rounded-xl transition ${
                              ord.isPinned
                                ? "text-amber-600 bg-amber-100/80 hover:bg-amber-200 font-bold"
                                : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title={ord.isPinned ? "Unpin Order from Top" : "Pin Order to Top"}
                          >
                            <Pin size={18} className={ord.isPinned ? "fill-amber-600" : ""} />
                          </button>

                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-2 rounded-xl text-slate-500 hover:text-magozi-800 hover:bg-magozi-50 transition"
                            title="View Full Order Details & Stepper"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Order from Firestore"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <div className="max-w-md mx-auto space-y-2">
                          <PackageCheck size={32} className="mx-auto text-slate-300" />
                          <p className="font-bold text-slate-800 text-sm">No Orders Found in Firestore `orders`</p>
                          <p className="text-xs text-slate-400">
                            Real customer app orders will appear here automatically via Firestore realtime listener.
                          </p>
                        </div>
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
        onUpdateDeliveryTiming={handleUpdateDeliveryTiming}
        onUpdateNotifyUser={handleUpdateNotifyUser}
      />
    </div>
  );
}
