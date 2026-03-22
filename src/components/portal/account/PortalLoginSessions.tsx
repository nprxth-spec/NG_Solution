"use client";

import { useEffect, useState } from "react";
import { getRecentLogins } from "@/app/(portal)/dashboard/actions";
import { MonitorSmartphone, Shield, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export function PortalLoginSessions() {
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentLogins().then(data => {
      setLogins(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading sessions...</div>;
  }

  return (
    <div className="space-y-4">
      {logins.map((log) => {
        const metadata = log.metadata as any;
        const provider = metadata?.provider || "Email";
        const isRecent = Date.now() - new Date(log.createdAt).getTime() < 1000 * 60 * 5; // 5 min
        
        // Parse simple standard OS/Browser from userAgent
        let deviceStr = log.userAgent || "Unknown Device";
        if (deviceStr.includes("Windows")) deviceStr = "Windows PC";
        else if (deviceStr.includes("Mac")) deviceStr = "Mac";
        else if (deviceStr.includes("iPhone") || deviceStr.includes("iPad")) deviceStr = "iOS Device";
        else if (deviceStr.includes("Android")) deviceStr = "Android Device";
        else if (deviceStr.length > 30) deviceStr = "Web Browser";

        return (
          <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/60 shadow-lg backdrop-blur-md dark:bg-slate-800/40 dark:border-white/10 transition-all hover:shadow-xl hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${isRecent ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10" : "bg-slate-50 text-slate-400 dark:bg-slate-800"}`}>
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                  {deviceStr} 
                  {isRecent && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">Current</span>}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {log.ip || "Unknown IP"}</span>
                  <span className="flex items-center gap-1">•</span>
                  <span className="flex items-center gap-1">Via {provider}</span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: th })}
              </span>
            </div>
          </div>
        );
      })}
      
      {logins.length === 0 && (
        <div className="text-center p-8 text-slate-500">
          No login history found.
        </div>
      )}
    </div>
  );
}
