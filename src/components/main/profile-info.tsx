"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { ComponentProps, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfileInfo({ 
  className,
  skeletonClassName,
  shouldRedirect = true,
  ...props
}: ComponentProps<"div"> & {
  skeletonClassName?: string;
  shouldRedirect?: boolean;
}) {
  const queryClient = useQueryClient();
  const { push } = useRouter();
  const { data } = useSession();

  const userInfo = data?.user;
  const profilePictureOptions = useMemo(() => [
    {
      label: "Your Profile",
      icon: UserRound,
      onClick: () => push(`/user/${userInfo?.id}`)
    },
    {
      label: "Settings",
      icon: Settings,
      onClick: () => push(`/settings/account`)
    },
    {
      label: "Log Out",
      icon: LogOut,
      onClick: async () => {
        queryClient.clear();
        await signOut();
      }
    }
  ], [userInfo, push, queryClient]);

  if (!userInfo) {
    return (
      <div className={cn(
        "flex items-center gap-2 ml-0",
        skeletonClassName
      )}>
        <div className="hidden @min-2xl:flex flex-col items-end gap-1.5">
          <Skeleton className="h-5 w-36 rounded-sm"/>
          <Skeleton className="h-4 w-30 rounded-sm"/>
        </div>
        <Skeleton className="rounded-full size-10 @min-2xl:size-12"/>
        <Skeleton className="rounded-full size-8 @min-2xl:size-10"/>
      </div>
    );
  }
  
  return (
    <Popover modal>
      <div 
        {...props}
        className={cn(
          "flex items-center gap-4.5",
          className
        )}
      >
        <div className="hidden @min-4xl:flex flex-col text-right">
          <h2 className="font-semibold text-sm">{userInfo.name}</h2>
          <span className="text-muted-foreground text-xs">Mealicious User</span>
        </div>
        <div className="relative aspect-square size-10 @min-2xl:size-12 rounded-full overflow-hidden shrink-0">
          <Image 
            src={userInfo.image || defaultProfilePicture}
            alt={`Profile picture of ${userInfo.name}`}
            fill
            className={cn(
              "object-cover object-center bg-slate-100",
              shouldRedirect && "cursor-pointer"
            )}
            onClick={shouldRedirect ? () => push(`/user/${userInfo.id}`) : undefined}
          />
        </div>
        <PopoverTrigger className="cursor-pointer">
          <Settings strokeWidth={1.25}/>
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" sideOffset={12} asChild>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center">
            <div className="relative aspect-square size-18 mb-2.5 rounded-full overflow-hidden shrink-0">
              <Image 
                src={userInfo.image || defaultProfilePicture}
                alt={`Profile picture of ${userInfo.name}`}
                fill
                className="object-cover object-center bg-slate-100"
              />
            </div>
            <h2 className="font-bold">{userInfo.name}</h2>
            <h3 className="text-muted-foreground text-sm">{userInfo.email}</h3>
          </div>
          <Separator />
          <div className="flex flex-col gap-2.5">
            {
              profilePictureOptions.map((o) => (
                <button 
                  key={o.label}
                  onClick={o.onClick}
                  className="cursor-pointer flex items-center hover:font-semibold gap-3 py-1 rounded-sm transition-[font-weight]"
                >
                  <o.icon size={18}/>
                  <span className="text-sm">{o.label}</span>
                </button>
              ))
            }
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
