"use client";

import { usePathname } from "next/navigation";
import { Settings2, UserRound } from "lucide-react";
import Link from "next/link";
import { Route } from "next";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    label: "Account",
    icon: UserRound,
    link: "/settings/account"
  },
  {
    label: "Preferences",
    icon: Settings2,
    link: "/settings/preferences"
  }
];

export default function SettingsTabs() {
  const pathname = usePathname();
  
  return (
    <div className="h-fit @min-2xl:sticky @min-2xl:top-23 @min-2xl:left-0 flex flex-col gap-2 @min-2xl:w-50">
      <h3 className="font-semibold text-muted-foreground text-xs uppercase mb-1">
        Settings Sections
      </h3>
      {
        settingsSections.map((s) => (
          <Link 
            key={s.label}
            href={s.link as Route}
            data-active={pathname.includes(s.link)}
            className={cn(
              "border border-border font-semibold flex items-center text-sm hover:bg-border gap-4 py-2 px-4 rounded-sm transition-colors",
              "data-[active=true]:border-mealicious-primary data-[active=true]:bg-mealicious-primary data-[active=true]:text-white data-[active=true]:pointer-events-none"
            )}
          >
            <s.icon size={16}/>
            {s.label}
          </Link>
        ))
      }
    </div>
  );
}
