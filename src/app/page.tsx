"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Facebook, FileText, CheckCircle, Zap, Shield, Clock, Globe, BarChart3, Users } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const BENEFITS = [
  { icon: Clock, title: "ประหยัดเวลา", desc: "ลดเวลาการทำงานซ้ำด้วยระบบอัตโนมัติอัจฉริยะ", color: "text-teal-600", bg: "bg-teal-50" },
  { icon: Zap, title: "เพิ่มประสิทธิภาพ", desc: "รวมทุกเครื่องมือไว้ในที่เดียวเพื่อ workflow ที่ลื่นไหล", color: "text-teal-600", bg: "bg-teal-50" },
  { icon: Shield, title: "ปลอดภัยสูงสุด", desc: "ล็อกอินด้วย Google และ Facebook มาตรฐานระดับโลก", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: CheckCircle, title: "ทดลองใช้ฟรี", desc: "เริ่มต้นด้วยเครดิตฟรี 100 เครดิตทันทีที่สมัคร", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Globe, title: "ใช้งานได้ทุกที่", desc: "รองรับหลายภาษาและเข้าถึงได้จากทุกอุปกรณ์", color: "text-orange-600", bg: "bg-orange-50" },
  { icon: Users, title: "รองรับทุกทีม", desc: "ออกแบบมาสำหรับนักการตลาดดิจิทัลทุกระดับ", color: "text-rose-600", bg: "bg-rose-50" },
];

const TOOLS = [
  { emoji: "📊", name: "Centxo", sub: "Facebook Ads", desc: "เชื่อมข้อมูล Ads กับ Google Sheets อัตโนมัติ", href: "/centxo/ads", badge: "WEB APP" },
  { emoji: "📄", name: "FilesGo", sub: "Invoice AI", desc: "ดึงข้อมูลจากใบเสร็จ PDF ด้วย AI เข้า Sheets", href: "/files-go/dashboard", badge: "WEB APP" },
  { emoji: "✅", name: "Ads Check", sub: "Extension", desc: "ตรวจสอบสถานะโฆษณาแบบ Real-time", href: "#", badge: "COMING SOON" },
  { emoji: "🌐", name: "Translator", sub: "Extension", desc: "แปลโฆษณาอัตโนมัติหลายภาษา", href: "#", badge: "COMING SOON" },
];

const STATS = [
  { value: "100+", label: "ผู้ใช้งาน" },
  { value: "10,000+", label: "เอกสารที่ประมวลผล" },
  { value: "99.9%", label: "Uptime" },
  { value: "Free", label: "เริ่มต้นใช้งาน" },
];

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">

      {/* ============== NAVBAR ============== */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow shadow-teal-500/30">
              N
            </div>
            <span className="font-black text-lg tracking-tight">
              <span className="text-teal-500">NG</span>
              <span className="text-slate-400 font-light"> Solution</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">Solutions</a>
            <a href="#benefits" className="hover:text-teal-600 transition-colors">Features</a>
            <Link href="/terms" className="hover:text-teal-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-teal-600 transition-colors">Privacy</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-all shadow-md shadow-teal-500/20"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ============== HERO ============== */}
      <section
        className="relative pt-28 pb-20 px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0dd1c5 0%, #00a99d 30%, #0284c7 70%, #0369a1 100%)" }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Left text */}
          <div className="flex-1 text-white">
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/20 text-white text-xs font-bold tracking-widest uppercase mb-6 border border-white/30">
              ⚡ #1 Ad Automation Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Professional<br />
              <span className="text-white/80">Advertising</span><br />
              Solutions
            </h1>
            <p className="text-white/80 text-lg mb-4 max-w-md leading-relaxed">
              เพิ่มประสิทธิภาพการทำงานของคุณถึง 60% ด้วยเครื่องมืออัตโนมัติสำหรับ Facebook Ads
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-teal-700 font-bold text-sm shadow-lg hover:scale-[1.03] transition-transform"
              >
                เริ่มต้นฟรีวันนี้
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                View All Solutions
              </a>
            </div>
          </div>

          {/* Right illustration */}
          <div className="flex-1 flex items-center justify-center relative min-h-[320px] lg:min-h-[460px] w-full mt-10 lg:mt-0">
            <div className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl aspect-square">
              <Image
                src="/illustration.png"
                alt="NG Solution Platform Illustration"
                fill
                className="object-contain scale-[1.15] lg:scale-[1.25] xl:scale-[1.35] drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.25] lg:hover:scale-[1.35] xl:hover:scale-[1.45] transition-transform duration-700"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============== STATS STRIP ============== */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.value}>
              <p className="text-3xl font-black text-teal-600 mb-1">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== BENEFITS ============== */}
      <section id="benefits" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              ทำไมต้องใช้ NG Solution?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              เราออกแบบทุกเครื่องมือโดยเข้าใจปัญหาของนักการตลาดดิจิทัลอย่างแท้จริง
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className={`w-11 h-11 rounded-2xl ${b.bg} flex items-center justify-center mb-4`}>
                  <b.icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== PRODUCT CARDS ============== */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              ชุดเครื่องมือครบครัน
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              ทุก Solution ออกแบบมาเพื่อช่วยให้คุณทำงานได้เร็วขึ้นและมีประสิทธิภาพมากขึ้น
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOLS.map((t) => (
              <Link
                key={t.name}
                href={t.href}
                className={`group relative flex flex-col p-6 rounded-3xl border transition-all duration-200 ${t.badge === "COMING SOON"
                    ? "border-slate-100 bg-slate-50 opacity-70 pointer-events-none"
                    : "border-teal-100 bg-white hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1"
                  }`}
              >
                <div className="text-3xl mb-4">{t.emoji}</div>
                <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${t.badge === "COMING SOON" ? "text-slate-400" : "text-teal-600"}`}>
                  {t.badge}
                </span>
                <h3 className="text-lg font-black text-slate-900">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{t.desc}</p>
                {t.badge !== "COMING SOON" && (
                  <span className="mt-auto inline-flex items-center gap-1 text-teal-600 text-sm font-semibold group-hover:gap-2 transition-all">
                    เข้าใช้งาน <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============== HERO CTA STRIP ============== */}
      <section
        className="py-20 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0dd1c5 0%, #00b4a0 50%, #0284c7 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-3">🚀 เริ่มต้นใช้งานได้เลย</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            1 บัญชี, ทุก Solution
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            สมัครฟรีและรับ 100 เครดิตทันที ใช้ได้กับทุก Tool ในระบบ
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-teal-700 font-bold text-sm shadow-lg hover:scale-[1.03] transition-transform min-w-[200px] justify-center"
            >
              <GoogleIcon />
              Sign in with Google
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm shadow-lg hover:scale-[1.03] transition-transform min-w-[200px] justify-center"
            >
              <Facebook className="w-4 h-4 fill-white" />
              Sign in with Facebook
            </Link>
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="bg-white border-t border-slate-100 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white font-black text-xs">N</div>
                <span className="font-black text-slate-900">NG Solution</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Professional ad automation tools built for digital marketers.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Solutions</p>
              <ul className="space-y-2.5">
                <li><Link href="/centxo/ads" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">Centxo</Link></li>
                <li><Link href="/files-go/dashboard" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">FilesGo</Link></li>
                <li><span className="text-sm text-slate-400">Ads Check (Soon)</span></li>
                <li><span className="text-sm text-slate-400">Translator (Soon)</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Policy</p>
              <ul className="space-y-2.5">
                <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Support</p>
              <ul className="space-y-2.5">
                <li><Link href="/login" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">Sign In</Link></li>
                <li><Link href="/dashboard" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2026 NG Solution. All rights reserved.</p>
            <p className="text-xs text-slate-400">Made with ❤️ for digital marketers</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
