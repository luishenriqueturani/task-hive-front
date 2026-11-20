import { AmbientBackground } from "@/components/layout/ambient-background";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/redirect-to-login";

/**
 * Shell de `/admin/*`: nav lateral no desktop, header próprio.
 * CLIENT autenticado recebe 404 (não revelar que a área existe).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin("/admin");

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-app-bg">
      <AmbientBackground />
      <AdminSidebar />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader user={user} />
        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
