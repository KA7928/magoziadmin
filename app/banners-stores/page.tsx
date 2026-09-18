"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BannersStoresRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/banners");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
      Redirecting to Banners Management...
    </div>
  );
}
