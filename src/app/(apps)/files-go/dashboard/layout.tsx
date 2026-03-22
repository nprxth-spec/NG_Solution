import { auth } from "@/lib/auth";
import Sidebar from "@/components/files-go/Sidebar";
import { DashboardUploadProvider } from "@/components/files-go/DashboardUploadContext";
import { PortalSidebar } from "@/components/shared/PortalSidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;
    const credits = (user as any)?.credits ?? 0;
    const plan = (user as any)?.plan ?? "free";

    return (
      <div className="flex h-screen bg-[#062329] transition-colors overflow-hidden">
        <PortalSidebar />

        <div className="transition-all duration-300 h-screen flex flex-1 min-w-0 pr-1 py-1 lg:pr-1.5 lg:py-1.5 overflow-hidden">
          <div className="w-full h-full rounded-xl bg-white shadow-2xl shadow-slate-900/10 border border-white/60 overflow-hidden flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 min-h-0 pt-6">
              {/* Upload state lives in provider so it survives navigation; MemoizedMain avoids re-rendering other pages while upload state updates */}
              <DashboardUploadProvider>
                <div className="flex-1 min-h-0 overflow-auto">
                  {children}
                </div>
              </DashboardUploadProvider>
            </div>
          </div>
        </div>
      </div>
    );
}
