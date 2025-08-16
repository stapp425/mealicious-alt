"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/main/app-sidebar";
import ScrollToTopButton from "@/components/main/scroll-to-top-button";
import RecipeSearchBar from "@/components/main/recipe-search-bar";
import { SessionProvider } from "next-auth/react";
import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import Image from "next/image";
import ProfileInfo from "@/components/main/profile-info";

const queryClient = new QueryClient();

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SidebarProvider>
        <AppSidebar />
        <QueryClientProvider client={queryClient}>
          <main className="@container/main relative min-h-screen max-w-screen flex-1 flex flex-col">
            <header className="h-20 print:hidden sticky border-b top-0 bg-background flex z-50 items-center gap-4 p-4">
              <SidebarTrigger className="cursor-pointer"/>
              <Image
                src={siteLogo}
                alt="Mealicious Logo"
                width={75}
                className="dark:invert"
                priority
              />
              <RecipeSearchBar />
              <ProfileInfo />
            </header>
            {children}
            <ScrollToTopButton />
          </main>
        </QueryClientProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}
