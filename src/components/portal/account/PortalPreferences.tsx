"use client";

import { useState, useEffect } from "react";
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Globe, 
  Clock 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Language } from "@/lib/translations";

const ACCENT_COLORS = [
  { id: "blue", label: "น้ำเงิน", cls: "bg-teal-600" },
  { id: "purple", label: "ม่วง", cls: "bg-purple-600" },
  { id: "green", label: "เขียว", cls: "bg-green-600" },
  { id: "orange", label: "ส้ม", cls: "bg-orange-500" },
  { id: "red", label: "แดง", cls: "bg-red-600" },
  { id: "pink", label: "ชมพู", cls: "bg-pink-600" },
];

const getTimezoneLabel = (tz: string) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
    const offsetString = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
    if (!offsetString || offsetString === 'GMT') return `${tz.replace(/_/g, ' ')} (UTC)`;

    const offset = offsetString.replace('GMT', ''); // e.g. "+8", "-5", "+05:30"
    const sign = offset[0]; // "+" or "-"
    const rest = offset.substring(1);
    const parts = rest.split(':');
    let hours = parts[0];
    if (hours.length === 1) hours = "0" + hours;
    const minutes = parts.length > 1 ? `:${parts[1]}` : "";

    return `${tz.replace(/_/g, ' ')} (UTC${sign}${hours}${minutes})`;
  } catch {
    return tz.replace(/_/g, ' ');
  }
};

export function PortalPreferences() {
  const {
    theme: globalTheme,
    accentColor: globalAccent,
    language: globalLanguage,
    timezone: globalTimezone,
    setTheme: setGlobalTheme,
    setAccentColor: setGlobalAccent,
    setLanguage: setGlobalLanguage,
    setTimezone: setGlobalTimezone,
  } = useTheme();

  // Preferences (Local state for editing before save)
  const [theme, setTheme] = useState(globalTheme);
  const [accentColor, setAccent] = useState(globalAccent);
  const [language, setLanguage] = useState(globalLanguage);
  const [timezone, setTimezone] = useState(globalTimezone);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const isThai = language === "th";

  const themeOptions = [
    { id: "light", labelTh: "สว่าง", labelEn: "Light", icon: Sun },
    { id: "dark", labelTh: "มืด", labelEn: "Dark", icon: Moon },
    { id: "system", labelTh: "ตามระบบ", labelEn: "System", icon: Monitor },
  ] as const;

  // Sync with global state when it changes (e.g. on initial load)
  useEffect(() => {
    setTheme(globalTheme);
    setAccent(globalAccent);
    setLanguage(globalLanguage);

    // Auto-detect timezone if not set
    if (!globalTimezone || globalTimezone === "Asia/Bangkok") {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected && detected !== globalTimezone) {
          setTimezone(detected);
          // We don't auto-save to DB here to avoid unprompted saves, but we set it locally
        } else {
          setTimezone(globalTimezone);
        }
      } catch {
        setTimezone(globalTimezone);
      }
    } else {
      setTimezone(globalTimezone);
    }
  }, [globalTheme, globalAccent, globalLanguage, globalTimezone]);

  const handlePreferenceChange = async (key: "theme" | "accentColor" | "language" | "timezone", val: string) => {
    // Optimistic UI updates
    if (key === "theme") { setTheme(val as "light" | "dark" | "system"); setGlobalTheme(val as "light" | "dark" | "system"); }
    if (key === "accentColor") { setAccent(val); setGlobalAccent(val); }
    if (key === "language") { setLanguage(val as Language); setGlobalLanguage(val as Language); }
    if (key === "timezone") { setTimezone(val); setGlobalTimezone(val); }

    setPrefsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, accentColor, language, timezone, [key]: val }),
      });
      toast.success(isThai ? "บันทึกการตั้งค่าแล้ว" : "Preferences saved");
    } catch {
      toast.error(isThai ? "เกิดข้อผิดพลาด" : "Error saving preferences");
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-800/40 dark:border-white/10">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            {isThai ? "การแสดงผลและภาษา" : "Display & language"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {isThai
              ? "ปรับธีม สี ภาษา และไทม์โซน"
              : "Adjust theme, accent color, language and timezone."}
          </p>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{isThai ? "ธีม" : "Theme"}</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((t) => (
                <button
                  key={t.id}
                  disabled={prefsSaving}
                  onClick={() => handlePreferenceChange("theme", t.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                    theme === t.id
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10"
                      : "border-slate-100 dark:border-slate-700 hover:border-slate-200"
                  )}
                >
                  <t.icon
                    className={cn(
                      "w-5 h-5",
                      theme === t.id ? "text-teal-500" : "text-slate-400"
                    )}
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isThai ? t.labelTh : t.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">{isThai ? "สีธีมหลัก" : "Accent color"}</Label>
            <div className="flex gap-3 flex-wrap pt-2">
              {ACCENT_COLORS.map((c) => (
                <button 
                  key={c.id} 
                  disabled={prefsSaving} 
                  onClick={() => handlePreferenceChange("accentColor", c.id)} 
                  title={c.label}
                  className={cn("w-10 h-10 rounded-full cursor-pointer relative transition-all duration-300", c.cls, accentColor === c.id && "ring-4 ring-offset-4 ring-slate-200 dark:ring-slate-700 dark:ring-offset-slate-900 shadow-xl scale-110")}
                >
                  {accentColor === c.id && <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-1.5 flex flex-col justify-end">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Globe className="w-4 h-4 text-slate-400" />
                {isThai ? "ภาษา" : "Language"}
              </Label>
              <Select
                value={language}
                disabled={prefsSaving}
                onValueChange={(val) => handlePreferenceChange("language", val)}
              >
                <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/50 dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  className="max-h-[300px]"
                >
                  <SelectItem value="th">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://flagcdn.com/w20/th.png"
                        srcSet="https://flagcdn.com/w40/th.png 2x"
                        width="20"
                        alt="TH"
                        className="rounded-sm"
                      />
                      ภาษาไทย
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://flagcdn.com/w20/us.png"
                        srcSet="https://flagcdn.com/w40/us.png 2x"
                        width="20"
                        alt="US"
                        className="rounded-sm"
                      />
                      English
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 flex flex-col justify-end">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                {isThai ? "ไทม์โซน" : "Timezone"}
              </Label>
              <Select
                value={timezone}
                disabled={prefsSaving}
                onValueChange={(val) => handlePreferenceChange("timezone", val)}
              >
                <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/50 dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  className="max-h-[300px]"
                >
                  {Intl.supportedValuesOf("timeZone").map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {getTimezoneLabel(tz)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
