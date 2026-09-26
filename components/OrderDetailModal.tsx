"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  X, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  CheckCheck, 
  XCircle,
  CreditCard,
  ExternalLink,
  BellRing
} from "lucide-react";

interface OrderDetailModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onUpdateDeliveryTiming?: (orderId: string, newTiming: string) => Promise<void>;
  onUpdateNotifyUser?: (orderId: string, message: string) => Promise<void>;
}

const ORDER_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "PLACED", label: "Placed", icon: Clock },
  { status: "PACKING", label: "Packing", icon: Package },
  { status: "OUT_FOR_DELIVERY", label: "Out For Delivery", icon: Truck },
  { status: "AT_DOORSTEPS", label: "At Doorsteps", icon: MapPin },
  { status: "DELIVERED", label: "Delivered", icon: CheckCheck },
  { status: "CANCELLED", label: "Cancelled", icon: XCircle },
];

const PRESET_TIMINGS = ["8 to 15 Mins", "10 Mins", "15 Mins", "20 Mins", "30 Mins", "45 Mins", "1 Hour"];

const QUICK_NOTIFY_HINTS = [
  "Due to raining",
  "No delivery partner available",
  "Server down"
];

export default function OrderDetailModal({
  isOpen,
  order,
  onClose,
  onUpdateStatus,
  onUpdateDeliveryTiming,
  onUpdateNotifyUser,
}: OrderDetailModalProps) {
  const [isEditingTiming, setIsEditingTiming] = useState(false);
  const [customTiming, setCustomTiming] = useState("");
  const [customNotifyMessage, setCustomNotifyMessage] = useState("");

  useEffect(() => {
    if (order) {
      setCustomNotifyMessage(order.notifyuser || "");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleTimingChange = (newTiming: string) => {
    if (onUpdateDeliveryTiming) {
      onUpdateDeliveryTiming(order.id, newTiming);
    }
    setIsEditingTiming(false);
  };

  const handleCustomTimingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTiming.trim() && onUpdateDeliveryTiming) {
      onUpdateDeliveryTiming(order.id, customTiming.trim());
      setIsEditingTiming(false);
    }
  };

  const handleNotifyUserChange = (message: string) => {
    if (onUpdateNotifyUser) {
      onUpdateNotifyUser(order.id, message);
      setCustomNotifyMessage(message);
    }
  };

  const handleCustomNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateNotifyUser) {
      onUpdateNotifyUser(order.id, customNotifyMessage.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-slate-900 dark:text-white">{order.id}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Update Notification Section - Upside of Expected Delivery Timing */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                <BellRing size={18} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Update Notification (notifyuser)
                </p>
                {order.notifyuser ? (
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
                    Active: "<span className="text-amber-900 dark:text-amber-300 italic">{order.notifyuser}</span>"
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 italic">
                    No active notification set for this user
                  </p>
                )}
              </div>
            </div>

            {order.notifyuser && (
              <button
                type="button"
                onClick={() => handleNotifyUserChange("")}
                className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 text-[11px] font-bold transition shadow-2xs border border-rose-200 dark:border-rose-800"
                title="Clear notifyuser text in Firestore"
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* Quick Message Hints */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800/80 dark:text-amber-400 block mb-1.5">
              Quick Message Hints:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTIFY_HINTS.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => handleNotifyUserChange(hint)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                    order.notifyuser === hint
                      ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100/80 dark:hover:bg-amber-950/60"
                  }`}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notification Input */}
          <form onSubmit={handleCustomNotifySubmit} className="flex gap-1.5 pt-0.5">
            <input
              type="text"
              placeholder="Type custom update notification message..."
              value={customNotifyMessage}
              onChange={(e) => setCustomNotifyMessage(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none flex-1 text-slate-900 dark:text-white placeholder:text-amber-700/50 dark:placeholder:text-amber-400/50"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition shadow-xs"
            >
              Save
            </button>
          </form>
        </div>

        {/* Expected Delivery Timing Banner & Editor */}
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Expected Delivery Timing
              </p>
              <p className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                {order.deliveryTiming || "8 to 15 Mins"}
              </p>
            </div>
          </div>

          {isEditingTiming ? (
            <div className="w-full sm:w-auto space-y-2">
              <div className="flex flex-wrap gap-1">
                {PRESET_TIMINGS.map((timing) => (
                  <button
                    key={timing}
                    onClick={() => handleTimingChange(timing)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
                  >
                    {timing}
                  </button>
                ))}
              </div>
              <form onSubmit={handleCustomTimingSubmit} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Custom timing..."
                  value={customTiming}
                  onChange={(e) => setCustomTiming(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none flex-1"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTiming(false)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => {
                setCustomTiming(order.deliveryTiming || "");
                setIsEditingTiming(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700 transition shadow-sm"
            >
              ✏️ Change Timing
            </button>
          )}
        </div>

        {/* 1-Click 6-Step Delivery Status Stepper */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Realtime Delivery Status Stepper
            </p>
            {order.deliveryStatus && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-magozi-100 dark:bg-slate-700 text-magozi-900 dark:text-emerald-400 border border-magozi-200 dark:border-slate-600">
                Firestore deliveryStatus: "{order.deliveryStatus}"
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {ORDER_STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = order.status === step.status;
              const isCancelled = step.status === "CANCELLED";

              let btnBg = "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700";
              if (isActive) {
                if (isCancelled) {
                  btnBg = "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 font-bold";
                } else {
                  btnBg = "bg-magozi-800 text-white border-magozi-800 shadow-md shadow-magozi-800/20 font-bold";
                }
              }

              return (
                <button
                  key={step.status}
                  onClick={() => onUpdateStatus(order.id, step.status)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${btnBg}`}
                >
                  <StepIcon size={18} />
                  <span className="text-[11px] leading-tight text-center">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer & Location/Address Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Customer Details
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <User size={14} className="text-magozi-800 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>Contact Number: <strong className="text-slate-900 dark:text-white">{order.contactNumber || order.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-slate-400" />
                <span>Payment: <strong className="text-slate-900 dark:text-white">{order.paymentStatus}</strong></span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Delivery Location & Address
                </h4>
                <a
                  href={
                    order.latitude && order.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([order.location, order.address].filter(Boolean).join(", "))}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
                >
                  <ExternalLink size={12} />
                  <span>Google Maps 🗺️</span>
                </a>
              </div>
              <a
                href={
                  order.latitude && order.longitude
                    ? `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([order.location, order.address].filter(Boolean).join(", "))}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed hover:text-magozi-800 dark:hover:text-emerald-400 transition"
              >
                <MapPin size={16} className="text-magozi-800 dark:text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white group-hover:underline flex items-center gap-1">
                    <span>{order.location || "Delivery Address"}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{order.address}</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Itemized List */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Itemized Order Breakdown ({order.items.length} Items)
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-magozi-50 dark:bg-slate-800 text-magozi-800 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-magozi-100 dark:border-slate-700">
                    {item.quantity}x
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.unit} • {formatCurrency(item.price)} each</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown & Total Amount Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="space-y-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Delivery Charges</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {order.deliveryFee ? formatCurrency(order.deliveryFee) : "FREE (₹0)"}
              </span>
            </div>
            {Boolean(order.discount) && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Discount / Coupon</span>
                <span>-{formatCurrency(order.discount!)}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grand Total</span>
              <p className="text-2xl font-extrabold text-magozi-900 dark:text-emerald-400">{formatCurrency(order.totalAmount)}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold transition border border-slate-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
