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
import { ArrowDownToLine, Calendar, ChevronDown, Home, List, Pencil, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import siteLogo from "@/img/logo/mealicious-logo.svg";
import SidebarUser from "@/components/main/sidebar-user";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Route } from "next";

const sidebarSections = [
  {
    title: "Recipe",
    path: "/recipes",
    sections: [
      {
        name: "Saved Recipes",
        icon: ArrowDownToLine,
        route: ""
      },
      {
        name: "Create Recipe",
        icon: Pencil,
        route: "/create"
      },
      {
        name: "Search New Recipes",
        icon: Search,
        route: "/search"
      }
    ]
  },
  {
    title: "Meal",
    path: "/meals",
    sections: [
      {
        name: "All Meals",
        icon: List,
        route: ""
      },
      {
        name: "Create Meal",
        icon: Pencil,
        route: "/create"
      }
    ]
  },
  {
    title: "Plan",
    path: "/plans",
    sections: [
      {
        name: "Plan Calendar",
        icon: Calendar,
        route: ""
      },
      {
        name: "Create Plan",
        icon: Pencil,
        route: "/create"
      }
    ]
  }
];
 
export default function AppSidebar() {
  const pathname = usePathname();
  
  return (
    <Sidebar className="print:hidden">
      <SidebarHeader className="h-20 border-b border-b-border flex flex-row">
        <Image
          src={siteLogo}
          alt="Mealicious Logo"
          width={100}
          className="dark:invert p-2"
          priority
        />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem data-state={pathname === "/dashboard" ? "active" : "inactive"}>
            <SidebarMenuButton asChild>
              <Link 
                href="/dashboard"
                className={cn(
                  "h-10 px-4 rounded-sm",
                  "group-data-[state=active]/menu-item:pointer-events-none",
                  "group-data-[state=active]/menu-item:bg-mealicious-primary/5",
                  "group-data-[state=active]/menu-item:shadow-xs",
                  "group-data-[state=active]/menu-item:dark:border group-data-[state=active]/menu-item:dark:border-mealicious-primary-border",
                  "group-data-[state=active]/menu-item:text-mealicious-primary-border"
                )}
              >
                <Home />
                <span className="font-semibold text-md">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {
          sidebarSections.map((group) => (
            <SidebarMenu
              key={group.title}
            >
              <Collapsible defaultOpen>
                <SidebarMenuItem
                  data-section-status={pathname.startsWith(group.path) ? "active" : "inactive"}
                  className="group/section"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={cn(
                      "h-10 flex justify-between items-center mb-1.5 px-2 rounded-sm",
                      "group-data-[section-status=active]/section:px-4",
                      "group-data-[section-status=active]/section:bg-muted"
                    )}>
                      <span className="font-semibold text-md">{group.title}</span>
                      <ChevronDown />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-4 mr-0 pr-0">
                      {
                        group.sections.map((section) => (
                          <SidebarMenuSubItem
                            key={section.name}
                            data-state={pathname === `${group.path}${section.route ? `${section.route}` : ""}` ? "active" : "inactive"}
                            className="group/sub-item"
                          >
                            <SidebarMenuButton asChild>
                              <Link 
                                href={`${group.path}/${section.route}` as Route} 
                                className={cn(
                                  "h-10 px-2 rounded-sm",
                                  "group-data-[state=active]/sub-item:pointer-events-none",
                                  "group-data-[state=active]/sub-item:bg-mealicious-primary/5",
                                  "group-data-[state=active]/sub-item:shadow-xs",
                                  "group-data-[state=active]/sub-item:dark:border group-data-[state=active]/sub-item:dark:border-mealicious-primary-border",
                                  "group-data-[state=active]/sub-item:text-mealicious-primary-border"
                                )}
                              >
                                <section.icon />
                                {section.name}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuSubItem>
                        ))
                      }
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
