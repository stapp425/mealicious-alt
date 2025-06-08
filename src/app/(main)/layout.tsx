import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/main/app-sidebar";
import { auth } from "@/auth";
import Breadcrumbs from "@/components/main/breadcrumbs";
import ScrollToTopButton from "@/components/main/scroll-to-top-button";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user)
    redirect("/login");

  const { user } = session;
  
  return (
    <SidebarProvider>
      <AppSidebar
        username={user.name!}
        email={user.email!}
        image={user.image as string | null}
      />
      <main className="min-h-screen flex-1 flex flex-col relative">
        <header className="print:hidden sticky border-b top-0 flex bg-background z-50 items-center p-4 gap-2">
          <SidebarTrigger className="cursor-pointer"/>
          <Breadcrumbs />
        </header>
        {children}
      </main>
      <ScrollToTopButton />
    </SidebarProvider>
  );
}