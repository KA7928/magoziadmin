import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "green" | "blue" | "amber" | "purple";
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "green",
}: MetricCardProps) {
  const colorStyles = {
    green: "bg-emerald-50 border-emerald-200 text-magozi-800 icon-bg-magozi-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800 icon-bg-blue-600",
    amber: "bg-amber-50 border-amber-200 text-amber-800 icon-bg-amber-600",
    purple: "bg-purple-50 border-purple-200 text-purple-800 icon-bg-purple-600",
  }[color];

  const iconBgStyles = {
    green: "bg-magozi-800 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-600 text-white",
    purple: "bg-purple-600 text-white",
  }[color];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl shadow-sm ${iconBgStyles}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
        {trend && (
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              trend.isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
