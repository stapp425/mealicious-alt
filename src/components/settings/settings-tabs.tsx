"use client";

import { usePathname } from "next/navigation";
import { Settings2, UserRound } from "lucide-react";
import Link from "next/link";
import { Route } from "next";

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
    <div className="h-fit sm:sticky sm:top-20 sm:left-0 flex flex-col gap-2 sm:w-[200px]">
      <h3 className="font-semibold text-muted-foreground text-xs uppercase mb-1">
        Settings Sections
      </h3>
      {
        settingsSections.map((s) => (
          <Link 
            key={s.label}
            href={s.link as Route}
            data-active={pathname.includes(s.link)}
            className="border border-border data-[active=true]:border-mealicious-primary data-[active=true]:bg-mealicious-primary data-[active=true]:text-white data-[active=true]:pointer-events-none font-semibold flex items-center text-sm hover:bg-border gap-4 py-2 px-4 rounded-sm transition-colors"
          >
            <s.icon size={16}/>
            {s.label}
          </Link>
        ))
      }
    </div>
  );
}
