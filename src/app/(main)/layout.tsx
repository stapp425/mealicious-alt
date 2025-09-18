"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/main/app-sidebar";
import ScrollToTopButton from "@/components/main/scroll-to-top-button";
import RecipeSearchBar from "@/components/main/recipe-search-bar";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import Image from "next/image";
import ProfileInfo from "@/components/main/profile-info";
import { useContainerQuery } from "@/hooks/use-container-query";
import { queryClient } from "@/lib/queryClient";
import { remToPx } from "@/lib/utils";

const CONTAINER_3XL_BREAKPOINT = 48;

export default function Layout({ children }: LayoutProps<"/">) {
  const [ref, matches] = useContainerQuery({
    condition: ({ width }) => width >= remToPx(CONTAINER_3XL_BREAKPOINT)
  });
  
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
          <main ref={ref} className="@container/main relative min-h-screen max-w-screen flex-1 flex flex-col">
            <header className="h-20 print:hidden sticky border-b top-0 bg-background flex z-50 items-center gap-4 p-4">
              <SidebarTrigger className="cursor-pointer"/>
              <Image
                src={siteLogo}
                alt="Mealicious Logo"
                width={75}
                className="dark:invert"
                priority
              />
              <div className="flex-1">
                <RecipeSearchBar 
                  mode={matches ? "popover" : "dialog"}
                  className="@max-3xl/main:ml-auto"
                />
              </div>
              <ProfileInfo />
            </header>
            {children}
            <ScrollToTopButton />
          </main>
        </SidebarProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
