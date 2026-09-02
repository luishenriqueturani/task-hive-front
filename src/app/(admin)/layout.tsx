import { AmbientBackground } from "@/components/layout/ambient-background";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/redirect-to-login";

/**
 * Shell mínimo de `/admin/*`. CLIENT autenticado recebe 404.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin("/admin");

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />
      <AdminHeader user={user} />
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
