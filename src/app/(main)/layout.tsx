import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/main/app-sidebar";
import Breadcrumbs from "@/components/main/breadcrumbs";
import ScrollToTopButton from "@/components/main/scroll-to-top-button";
import RecipeSearchBar from "@/components/main/recipe-search-bar";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="relative min-h-screen max-w-screen flex-1 flex flex-col">
        <header className="print:hidden sticky border-b top-0 bg-background flex z-50 justify-between md:justify-start items-center gap-3 p-4">
          <SidebarTrigger className="cursor-pointer"/>
          <RecipeSearchBar />
          <Breadcrumbs />
        </header>
        {children}
        <ScrollToTopButton />
      </main>
    </SidebarProvider>
  );
}
