"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ArrowDownToLine, Calendar, Home, List, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import SidebarUser from "@/components/main/sidebar-user";
import { Separator } from "@/components/ui/separator";

type AppSidebarProps = {
  username: string;
  email: string;
  image: string | null;
};
 
export function AppSidebar({ username, email, image }: AppSidebarProps) {
  return (
    <Sidebar className="print:hidden">
      <SidebarHeader>
        <Image
          src={siteLogo}
          alt="Mealicious Logo"
          width={100}
          className="dark:invert p-2"
          priority
        />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <span className="font-semibold text-md">Dashboard</span>
                <Home />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span className="font-semibold text-md">Recipe</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuButton asChild>
                  <Link href="/recipes">
                    Saved Recipes
                    <ArrowDownToLine />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuButton asChild>
                  <Link href="/recipes/create">
                    Create Recipe
                    <Pencil />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span className="font-semibold text-md">Meal</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuButton asChild>
                  <Link href="/meals">
                    All Meals
                    <List />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuButton asChild>
                  <Link href="/meals/create">
                    Create Meal
                    <Pencil />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span className="font-semibold text-md">Plan</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuButton asChild>
                  <Link href="/meals/calendar">
                    Meal Calendar
                    <Calendar />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser
          username={username}
          email={email}
          image={image}
        />
      </SidebarFooter>
    </Sidebar>
  );
}