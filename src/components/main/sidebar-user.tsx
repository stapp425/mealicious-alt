"use client";

import { useTheme } from "next-themes";
import { 
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { ChevronsUpDown, Laptop, LogOut, Moon, Settings, Sun } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { useEffect, useState } from "react";

type SidebarUserProps = {
  username: string,
  email: string,
  image: string | null
};

export default function SidebarUser({ username, email, image }: SidebarUserProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const { setTheme } = useTheme();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return null;
  
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="cursor-pointer flex justify-start gap-2.5 px-2 py-8">
              <Avatar className="size-9">
                <AvatarImage
                  src={image || undefined}
                  alt={`${username}'s Profile Picture`}
                />
                <AvatarFallback>
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold">{username}</span>
                <span>{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto"/>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-[175px]"
          >
            <DropdownMenuLabel>
              Options
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <span>Settings</span>
                <Settings />
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
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={async () => {
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