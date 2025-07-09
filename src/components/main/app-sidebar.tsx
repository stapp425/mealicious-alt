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
import { ArrowDownToLine, Calendar, Home, List, Pencil, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import SidebarUser from "@/components/main/sidebar-user";
import { Separator } from "@/components/ui/separator";

const sidebarSections = [
  {
    title: "Recipe",
    sections: [
      {
        name: "Saved Recipes",
        icon: ArrowDownToLine,
        href: "/recipes"
      },
      {
        name: "Create Recipe",
        icon: Pencil,
        href: "/recipes/create"
      },
      {
        name: "Search New Recipes",
        icon: Search,
        href: "/recipes/search"
      }
    ]
  },
  {
    title: "Meal",
    sections: [
      {
        name: "All Meals",
        icon: List,
        href: "/meals"
      },
      {
        name: "Create Meal",
        icon: Pencil,
        href: "/meals/create"
      }
    ]
  },
  {
    title: "Plan",
    sections: [
      {
        name: "Plan Calendar",
        icon: Calendar,
        href: "/plans"
      },
      {
        name: "Create Plan",
        icon: Pencil,
        href: "/plans/create"
      }
    ]
  }
];
 
export function AppSidebar() {
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
        {
          sidebarSections.map((s) => (
            <SidebarMenu key={s.title}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <span className="font-semibold text-md">{s.title}</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {
                    s.sections.map((s) => (
                      <SidebarMenuSubItem key={s.name}>
                        <SidebarMenuButton asChild>
                          <Link href={s.href}>
                            {s.name}
                            <s.icon />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    ))
                  }
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          ))
        }
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
