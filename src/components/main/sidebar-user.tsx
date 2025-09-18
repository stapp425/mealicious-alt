"use client";

import { useTheme } from "next-themes";
import { 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Laptop, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { useQueryClient } from "@tanstack/react-query";
import { useHydration } from "@/hooks/use-hydration";

export default function SidebarUser() {
  const queryClient = useQueryClient();
  const { data, status } = useSession();
  const hydrated = useHydration();
  const { setTheme } = useTheme();

  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-pointer flex justify-between gap-2.5 px-2 py-8">
            <Skeleton className="size-9 rounded-full"/>
            <div className="flex-1 grid gap-2">
              <Skeleton className="w-36 h-4 rounded-sm"/>
              <Skeleton className="w-full h-5 rounded-sm"/>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
    
  if (!data?.user || !hydrated) return null;
  const { id, image, name, email } = data.user;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="cursor-pointer flex justify-start gap-2.5 px-2 py-8">
              <div className="relative size-9 rounded-full overflow-hidden">
                <Image 
                  src={image || defaultProfilePicture}
                  alt={`Profile picture of ${name}`}
                  fill
                  className="object-cover object-center bg-slate-100"
                />
              </div>
              <div className="flex flex-col max-w-36">
                <span className="font-bold truncate text-sm">{name}</span>
                <span className="truncate text-muted-foreground text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto"/>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-46"
          >
            <DropdownMenuLabel>
              Options
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <Link href={`/user/${id}`} className="w-full flex justify-between items-center">
                  <span>Your Profile</span>
                  <User />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Change Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => setTheme("light")}
                      className="cursor-pointer"
                    >
                      Light
                      <Sun />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setTheme("dark")}
                      className="cursor-pointer"
                    >
                      Dark
                      <Moon />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setTheme("system")}
                      className="cursor-pointer"
                    >
                      System
                      <Laptop />
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem className="cursor-pointer">
                <Link href="/settings" className="w-full flex justify-between items-center">
                  <span>Settings</span>
                  <Settings />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={async () => {
                  queryClient.clear();
                  await signOut();
                }}
                className="cursor-pointer"
              >
                <span>Log Out</span>
                <LogOut />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
