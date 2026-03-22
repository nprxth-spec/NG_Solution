"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    CloudUpload,
    Sparkles,
    HardDrive,
    Sheet,
    X,
    ChevronDown,
} from "lucide-react";
import { useDashboardUpload, type UploadStage } from "@/components/files-go/DashboardUploadContext";

const stages: { key: UploadStage; label: string; icon: any }[] = [
    { key: "uploading", label: "Uploading", icon: CloudUpload },
    { key: "extracting", label: "AI Extracting", icon: Sparkles },
    { key: "drive", label: "Saving to Drive", icon: HardDrive },
    { key: "sheets", label: "Updating Sheet", icon: Sheet },
];

export function UploadTab() {
    const { data: session } = useSession();
    const upload = useDashboardUpload();
    const {
        queue,
        currentIndex,
        results,
        stage,
        showBatchComplete,
        duplicateAlertFilename,
        dismissDuplicateAlert,
        getRootProps,
        getInputProps,
        isDragActive,
        resetState,
        acknowledgeBatchComplete,
        requestSessionUpdate,
        isProcessing,
        currentFile,
    } = upload;

    // Drive folder selection (local state; upload progress lives in context)
    const [driveFolderId, setDriveFolderId] = useState("");
    const [driveFolderMode, setDriveFolderMode] = useState<"auto" | "custom">("auto");
    const [modeInitialized, setModeInitialized] = useState(false);
    const [modeMenuOpen, setModeMenuOpen] = useState(false);
    const modeMenuRef = useRef<HTMLDivElement | null>(null);
    const [folderError, setFolderError] = useState("");
    const [driveFolderLabel, setDriveFolderLabel] = useState("");
    const [spreadsheetTitle, setSpreadsheetTitle] = useState<string | null>(null); // ชื่อไฟล์สเปรดชีต

    const PICKER_ROOT_FOLDER_ID = "11-naB49cPhno_HpKcTbrmYPhNz_R8oJk";

    // Close mode dropdown when clicking outside
    useEffect(() => {
        if (!modeMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
                setModeMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [modeMenuOpen]);

    // Initialize folder ID and mode from session / API once on mount,
    // and resolve a human-readable label for the folder if present.
    useEffect(() => {
        if (modeInitialized && (driveFolderId ? driveFolderLabel !== "" : true)) return;
        const load = async () => {
            let id = driveFolderId;

            // 1) Try from session
            if (!id) {
                const initial = (session?.user as any)?.driveFolderId as string | undefined;
                if (initial) {
                    id = initial;
                }
            }

            // 2) Fallback to API if still empty
            if (!id) {
                try {
                    const res = await fetch("/api/files-go/drive-folder");
                    const data = await res.json();
                    if (res.ok && data?.data?.driveFolderId) {
                        id = data.data.driveFolderId as string;
                    }
                } catch {
                    // ignore
                }
            }

            if (id && !driveFolderId) {
                setDriveFolderId(id);
            }

            // Decide initial mode once
            if (!modeInitialized) {
                setDriveFolderMode(id ? "custom" : "auto");
                setModeInitialized(true);
            }

            // If we have an id but no label yet, try to resolve its path from Drive
            if (id && !driveFolderLabel) {
                try {
                    const res = await fetch(`/api/files-go/drive/folder-meta?id=${encodeURIComponent(id)}`);
                    const data = await res.json();
                    if (res.ok && data?.data) {
                        setDriveFolderLabel(
                            (data.data.path as string) ||
                            (data.data.name as string) ||
                            id
                        );
                    }
                } catch {
                    // ignore, we'll just fall back to showing the raw ID
                }
            }
        };
        void load();
    }, [session, modeInitialized, driveFolderId, driveFolderLabel]);

    // Load spreadsheet file name (ชื่อไฟล์) when user has sheetId
    useEffect(() => {
        const sheetId = (session?.user as any)?.sheetId as string | undefined;
        if (!sheetId) {
            setSpreadsheetTitle(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/files-go/google/sheets/title?sheetId=${encodeURIComponent(sheetId)}`);
                const data = await res.json();
                if (!cancelled && res.ok && data?.data?.title !== undefined) {
                    setSpreadsheetTitle(data.data.title as string);
                } else if (!cancelled) {
                    setSpreadsheetTitle("");
                }
            } catch {
                if (!cancelled) setSpreadsheetTitle("");
            }
        })();
        return () => { cancelled = true; };
    }, [session?.user ? (session.user as any).sheetId : null]);

    const loadGoogleApiScript = () =>
        new Promise<void>((resolve, reject) => {
            if (typeof window === "undefined") return reject(new Error("Window not available"));

            const onReady = () => {
                const gapi = (window as any).gapi;
                if (!gapi || !gapi.load) {
                    reject(new Error("gapi not available"));
                    return;
                }
                gapi.load("picker", {
                    callback: () => {
                        resolve();
                    },
                });
            };

            if ((window as any).gapi && (window as any).google && (window as any).google.picker) {
                // Script & picker already loaded
                resolve();
                return;
            }

            if ((window as any).gapi) {
                onReady();
                return;
            }

            const existing = document.querySelector<HTMLScriptElement>("script[data-google-api='true']");
            if (existing) {
                existing.addEventListener("load", onReady);
                existing.addEventListener("error", () =>
                    reject(new Error("Failed to load Google API script"))
                );
                return;
            }

            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.async = true;
            script.defer = true;
            script.dataset.googleApi = "true";
            script.onload = onReady;
            script.onerror = () => reject(new Error("Failed to load Google API script"));
            document.body.appendChild(script);
        });

    const handleOpenDrivePicker = async () => {
        setFolderError("");
        try {
            if (typeof window === "undefined") return;
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

            if (!apiKey) {
                setFolderError("Missing NEXT_PUBLIC_GOOGLE_API_KEY in environment.");
                return;
            }

            const res = await fetch("/api/files-go/google/access-token");
            const data = await res.json();
            if (!res.ok || !data?.data?.accessToken) {
                setFolderError(data?.error ?? "Google access token missing. Please sign in again.");
                return;
            }
            const accessToken = data.data.accessToken as string;

            await loadGoogleApiScript();

            const googleObj = (window as any).google;
            if (!googleObj || !googleObj.picker) {
                setFolderError("Google Picker API not available (picker library not loaded).");
                return;
            }

            const view = new googleObj.picker.DocsView(googleObj.picker.ViewId.FOLDERS)
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true)
                .setParent(PICKER_ROOT_FOLDER_ID);

            const picker = new googleObj.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(accessToken)
                .setDeveloperKey(apiKey)
                .setCallback((data: any) => {
                    if (data.action === googleObj.picker.Action.PICKED && data.docs && data.docs.length > 0) {
                        const picked = data.docs[0];
                        if (picked && picked.id) {
                            setDriveFolderId(picked.id);
                            setDriveFolderMode("custom");
                            const leafName = picked.name || picked.id;
                            setDriveFolderLabel(leafName);

                            // Persist selection immediately so it survives refresh
                            (async () => {
                                try {
                                    const res = await fetch("/api/files-go/drive-folder", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ driveFolderId: picked.id }),
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                        setFolderError(data.error ?? "Failed to save folder");
                                    } else {
                                        await requestSessionUpdate();
                                        // Refresh human-readable path after saving
                                        try {
                                            const metaRes = await fetch(
                                                `/api/files-go/drive/folder-meta?id=${encodeURIComponent(picked.id)}`
                                            );
                                            const metaData = await metaRes.json();
                                            if (metaRes.ok && metaData?.data) {
                                                setDriveFolderLabel(
                                                    (metaData.data.path as string) ||
                                                    (metaData.data.name as string) ||
                                                    leafName
                                                );
                                            }
                                        } catch {
                                            // ignore, keep fallback label
                                        }
                                    }
                                } catch (err: any) {
                                    setFolderError(err.message ?? "Failed to save folder");
                                }
                            })();
                        }
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (err: any) {
            setFolderError(err.message ?? "Failed to open Google Picker.");
        }
    };



    // Warn before leaving/reloading during upload so state isn’t lost
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isProcessing) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isProcessing]);

    return (
        <div className="max-w-4xl mx-auto w-full min-w-0">
            {duplicateAlertFilename && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                    <p className="flex-1 text-sm font-medium">
                        ไฟล์ <span className="font-semibold">{duplicateAlertFilename}</span> ซ้ำแล้ว — ประมวลผลไปแล้ว ไม่มีการอัปโหลดซ้ำ
                    </p>
                    <button
                        type="button"
                        onClick={dismissDuplicateAlert}
                        className="shrink-0 rounded-lg p-1.5 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                        aria-label="ปิด"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Batch Upload Invoices</h1>
                    <p className="text-slate-500">
                        Drop multiple Facebook Ads PDF invoices to extract and sync automatically.
                    </p>
                </div>
                {(stage === "done" || results.length > 0) && (
                    <button
                        onClick={resetState}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <X className="w-4 h-4" /> Clear & Upload More
                    </button>
                )}
            </div>

            {/* Drive folder selector */}
            <div className="mb-6 bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <p className="text-sm font-semibold text-slate-800 mb-1">Drive destination</p>
                    <p className="text-xs text-slate-400 mb-1">
                        Choose whether to let the app create a monthly folder automatically, or always upload into a specific folder you pick from Google Drive.
                    </p>
                    <div className="mt-1 relative inline-block" ref={modeMenuRef}>
                        <button
                            type="button"
                            onClick={() => setModeMenuOpen((v) => !v)}
                            className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 flex items-center justify-between hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm cursor-pointer"
                        >
                            <span>
                                {driveFolderMode === "auto"
                                    ? "Automatic folder — FB_Invoices_YYYY-MM"
                                    : "Custom folder — use Pick from Drive"}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        {modeMenuOpen && (
                            <div className="absolute z-20 mt-2 w-full sm:w-80 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 py-1 text-xs text-slate-700">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setModeMenuOpen(false);
                                        setDriveFolderMode("auto");
                                        setFolderError("");
                                        try {
                                            await fetch("/api/files-go/drive-folder", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ driveFolderId: null }),
                                            });
                                            setDriveFolderId("");
                                            setDriveFolderLabel("");
                                            await requestSessionUpdate();
                                        } catch {
                                            // ignore
                                        }
                                    }}
                                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 rounded-xl cursor-pointer ${
                                        driveFolderMode === "auto" ? "bg-slate-50" : ""
                                    }`}
                                >
                                    <span className="font-semibold">Automatic folder</span>{" "}
                                    <span className="text-slate-500">— FB_Invoices_YYYY-MM</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModeMenuOpen(false);
                                        setDriveFolderMode("custom");
                                        setFolderError("");
                                    }}
                                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 rounded-xl cursor-pointer ${
                                        driveFolderMode === "custom" ? "bg-slate-50" : ""
                                    }`}
                                >
                                    <span className="font-semibold">Custom folder</span>{" "}
                                    <span className="text-slate-500">— use Pick from Drive</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-2 space-y-1">
                        {folderError && (
                            <>
                                <p className="text-xs text-red-600">
                                    {folderError}
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                    ถ้าเห็น 403 หรือไม่มีสิทธิ์จาก Google อาจเป็นเพราะตอนล็อกอินไม่ได้กดอนุญาตสิทธิ์ Drive/Sheets — กรุณา{" "}
                                    <button
                                        type="button"
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="underline font-medium hover:text-amber-900 cursor-pointer"
                                    >
                                        ออกจากระบบแล้วล็อกอินใหม่
                                    </button>
                                    {" "}แล้วกดอนุญาตทุกสิทธิ์ที่แอปขอ
                                </p>
                            </>
                        )}
                        <p className="text-xs text-slate-500">
                            Current target folder:&nbsp;
                            {driveFolderMode === "auto" ? (
                                <span className="font-medium text-slate-700">
                                    Automatic — <code className="px-1 rounded bg-slate-100">FB_Invoices_YYYY-MM</code>
                                </span>
                            ) : driveFolderId ? (
                                <a
                                    href={`https://drive.google.com/drive/folders/${driveFolderId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-teal-600 hover:text-teal-800 underline"
                                >
                                    {driveFolderLabel || driveFolderId}
                                </a>
                            ) : (
                                <span className="text-slate-400">Not set</span>
                            )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Current target sheet:&nbsp;
                            <span className="font-medium text-slate-700">
                                {(session?.user as any)?.sheetId ? (
                                    <>
                                        {/* ชื่อไฟล์ = ชื่อสเปรดชีต (เอกสาร), ชื่อชีต = ชื่อแท็บ */}
                                        {spreadsheetTitle !== null ? spreadsheetTitle || "—" : "…"}
                                        {" > "}
                                        <a
                                            href={`https://docs.google.com/spreadsheets/d/${(session?.user as any).sheetId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-teal-600 hover:text-teal-800 underline"
                                        >
                                            {(session?.user as any)?.sheetName ?? (session?.user as any).sheetId}
                                        </a>
                                    </>
                                ) : (
                                    "Not set"
                                )}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleOpenDrivePicker}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        disabled={driveFolderMode !== "custom"}
                    >
                        <HardDrive className="w-4 h-4" />
                        Pick from Drive
                    </button>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 mb-8 ${isDragActive
                        ? "border-teal-500 bg-teal-50"
                        : stage === "done"
                            ? "border-green-400 bg-green-50"
                            : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30"
                    }`}
            >
                <input {...getInputProps()} />

                {stage === "idle" && (
                    <div>
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-teal-500" />
                        </div>
                        <p className="text-lg font-semibold text-slate-700 mb-1">
                            {isDragActive ? "Drop PDFs here…" : "Drag & drop your invoice PDFs"}
                        </p>
                        <p className="text-sm text-slate-400 mb-4">
                            Select or drop multiple files at once
                        </p>
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-500">
                            PDF only
                        </span>
                    </div>
                )}

                {isProcessing && currentFile && (
                    <div>
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto relative">
                                <FileText className="w-8 h-8 text-teal-500" />
                                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full landing-accent-bg flex items-center justify-center text-white text-[10px] font-bold">
                                    {currentIndex + 1}/{queue.length}
                                </div>
                            </div>
                        </div>
                        <p className="font-medium text-slate-700 text-sm mb-1 truncate max-w-xs mx-auto">
                            Processing: {currentFile.name}
                        </p>
                        <p className="text-slate-400 text-xs mt-2 flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {stages.find(s => s.key === stage)?.label || "Working..."}
                        </p>
                    </div>
                )}

                {stage === "done" && (
                    <div>
                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                        </div>
                        <p className="font-semibold text-green-700 text-lg mb-1">Batch Complete!</p>
                        <p className="text-slate-500 text-sm">
                            Processed {results.length} file{results.length > 1 ? "s" : ""}
                        </p>
                    </div>
                )}
            </div>

            {/* Batch Complete Modal */}
            {showBatchComplete && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-900">Batch Complete!</p>
                                <p className="text-xs text-slate-500">
                                    Processed {results.length} file{results.length > 1 ? "s" : ""}. See the details in Processing Results.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={acknowledgeBatchComplete}
                                className="px-4 py-2 rounded-xl landing-accent-bg text-white text-sm font-medium hover:opacity-95 cursor-pointer"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">Processing Results</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {results.map((res, idx) => {
                            if ('error' in res) {
                                // Error Result
                                return (
                                    <div key={idx} className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-red-900 truncate mb-1">
                                                {res.filename}
                                            </p>
                                            <p className="text-xs text-red-600">{res.error}</p>
                                        </div>
                                    </div>
                                );
                            }

                            // Success Result
                            return (
                                <div key={idx} className="bg-white border text-left border-slate-100 rounded-2xl p-5 shadow-sm hover:border-slate-200 transition-colors">
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="min-w-0 pr-4">
                                                <p className="text-sm font-semibold text-slate-900 truncate" title={res.filename}>
                                                    {res.filename}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                    Processed successfully
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {res.driveLink && (
                                            <a
                                                href={res.driveLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-100 bg-teal-50 text-teal-600 text-xs font-semibold hover:bg-teal-100 transition-colors"
                                            >
                                                <HardDrive className="w-3.5 h-3.5" /> Drive
                                            </a>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                            <p className="text-sm font-semibold text-slate-700">{res.date}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate" title={res.billed_to}>{res.billed_to}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Card</p>
                                            <p className="text-sm font-semibold text-slate-700">•••• {res.card_last_4}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                                            <p className="text-sm font-semibold text-slate-700">{res.amount?.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Currency</p>
                                            <p className="text-sm font-semibold text-slate-700">{res.currency}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
