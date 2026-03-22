"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Shield, Sparkles, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { BILLING_PLANS } from "@/lib/billing-plans";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";

export function PortalBilling() {
  const { data: session } = useSession();
  const { language } = useTheme();
  const isThai = language === "th";
  
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const credits = (session?.user as any)?.credits ?? 0;
  const currentPlanId = (session?.user as any)?.plan ?? "free";
  const isBusiness = currentPlanId === "business";

  const handleUpgrade = async (planId: string, priceIdEnvKey: string) => {
    if (loadingCheckout) return;
    setLoadingCheckout(planId);
    
    try {
      const priceId = process.env[priceIdEnvKey] ?? process.env.STRIPE_DEFAULT_PRICE_ID;
      
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Failed to start checkout");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || (isThai ? "ไม่สามารถเริ่มการชำระเงินได้" : "Checkout failed"));
      setLoadingCheckout(null);
    }
  };

  const PRO_FEATURES = isThai ? [
    "ส่งออกไม่จำกัดต่อเดือน",
    "รองรับ 10 บัญชีโฆษณา",
    "ตั้งส่งออกอัตโนมัติ (Auto-export)",
    "การสนับสนุนแบบ Priority"
  ] : [
    "Unlimited exports per month",
    "Up to 10 ad accounts",
    "Auto-export schedules",
    "Priority support"
  ];

  const BUSINESS_FEATURES = isThai ? [
    "ทุกอย่างในแผน Pro",
    "จำนวนบัญชีโฆษณาไม่จำกัด",
    "Priority queue ในการประมวลผล Export",
    "ที่ปรึกษาด้านการตั้งค่าฟรีเดือนละ 1 ครั้ง"
  ] : [
    "Everything in Pro",
    "Unlimited ad accounts",
    "Priority export queue",
    "Monthly configuration review call"
  ];

  const UI_PLANS = [
    {
      id: "free",
      nameTh: BILLING_PLANS.free.nameTh,
      nameEn: BILLING_PLANS.free.nameEn,
      priceLabelTh: "ฟรี",
      priceLabelEn: "Free",
      descTh: "สำหรับเริ่มต้นใช้งาน",
      descEn: "Getting started with basic features.",
      featuresTh: ["ใช้เครดิตได้ 100 เครดิตต่อเดือน", "รองรับ 5 บัญชีโฆษณา"],
      featuresEn: ["100 Credits per month", "Up to 5 ad accounts"],
      priceIdEnvKey: "",
    },
    {
      id: "pro",
      nameTh: BILLING_PLANS.pro.nameTh,
      nameEn: BILLING_PLANS.pro.nameEn,
      priceLabelTh: "฿499 / เดือน",
      priceLabelEn: "฿499 / month",
      descTh: "เหมาะสำหรับสายยิงแอดทั่วไป",
      descEn: "Perfect for regular advertisers.",
      featuresTh: ["ใช้เครดิตได้ 5000 เครดิตต่อเดือน", ...PRO_FEATURES],
      featuresEn: ["5000 Credits per month", ...PRO_FEATURES],
      priceIdEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PRO",
    },
    {
      id: "business",
      nameTh: BILLING_PLANS.business.nameTh,
      nameEn: BILLING_PLANS.business.nameEn,
      priceLabelTh: "฿1,299 / เดือน",
      priceLabelEn: "฿1,299 / month",
      descTh: "สำหรับเอเจนซี",
      descEn: "For agencies and teams.",
      featuresTh: ["เครดิตไม่จำกัด", ...BUSINESS_FEATURES],
      featuresEn: ["Unlimited Credits", ...BUSINESS_FEATURES],
      priceIdEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS",
      highlight: true
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            {isThai ? "จัดการอัปเกรดแอปและเครดิต" : "Subscription & Credits"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isThai ? "ซื้อแพ็กเกจครั้งเดียว ใช้เครดิตร่วมกันได้กับทุกแอป (Centxo, FilesGo)" : "One subscription covers all portal applications."}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1 text-sm bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl border border-white/60 shadow-lg backdrop-blur-md shrink-0">
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">{isThai ? "เครดิตคงเหลือ" : "Remaining Credits"}</p>
          <div className="flex items-center gap-2 text-2xl font-bold text-teal-600">
             {isBusiness ? (isThai ? "ไม่จำกัด" : "Unlimited") : credits} 
             <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isThai ? "แพ็กเกจปัจจุบัน: " : "Current Plan: "} <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{currentPlanId}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
        {UI_PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <Card 
              key={plan.id}
              className={`flex flex-col bg-white/40 backdrop-blur-md transition-all hover:shadow-2xl hover:-translate-y-1.5 ${plan.highlight ? 'border-teal-500/50 shadow-xl shadow-teal-500/10' : 'border-white/60 shadow-lg'}`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex justify-between">
                  <span>{isThai ? plan.nameTh : plan.nameEn}</span>
                  {plan.highlight && <Badge className="bg-teal-500 hover:bg-teal-600 text-[10px]">Recommend</Badge>}
                </CardTitle>
                <div className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
                  {isThai ? plan.priceLabelTh : plan.priceLabelEn}
                </div>
                <CardDescription className="text-xs mt-1">
                  {isThai ? plan.descTh : plan.descEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                <ul className="space-y-2">
                  {(isThai ? plan.featuresTh : plan.featuresEn).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4 mt-auto">
                <Button 
                  className={`w-full ${isCurrent ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : (plan.highlight ? "bg-teal-500 hover:bg-teal-600" : "")}`}
                  variant={isCurrent ? "outline" : "default"}
                  disabled={loadingCheckout === plan.id || isCurrent || plan.id === "free"}
                  onClick={() => handleUpgrade(plan.id, plan.priceIdEnvKey)}
                >
                  {isCurrent 
                    ? (isThai ? "แพ็กเกจปัจจุบัน" : "Current Plan")
                    : loadingCheckout === plan.id
                      ? "Processing..."
                      : (isThai ? "อัปเกรดเลย" : "Upgrade Now")}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
