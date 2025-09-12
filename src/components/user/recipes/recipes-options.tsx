"use client";

import { UserRecipesView } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownToLine, Heart, LoaderCircle, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { Route } from "next";
import { cn } from "@/lib/utils";

type ViewOption = {
  value: UserRecipesView;
  label: string;
  href: Route,
  icon: typeof Pencil
};

export default function RecipesOptions({ userId }: { userId: string; }) {
  const { push } = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const viewOptions: ViewOption[] = useMemo(
    () => [
      {
        value: "created",
        label: "Created",
        href: `/user/${userId}/recipes/created` as Route,
        icon: Pencil
      },
      {
        value: "saved",
        label: "Saved",
        href: `/user/${userId}/recipes/saved` as Route,
        icon: ArrowDownToLine
      },
      {
        value: "favorited",
        label: "Favorited",
        href: `/user/${userId}/recipes/favorited` as Route,
        icon: Heart
      },
    ],
    [userId]
  );

  const navigateToPath = useCallback(
    (route: Route) => startTransition(() => {
      push(route);
    }),
    [startTransition, push]
  );

  const activeSection = viewOptions.find((o) => pathname.includes(o.href))?.value;

  return (
    <>
    <Select
      value={activeSection}
      disabled={isPending}
      onValueChange={(val) => navigateToPath(viewOptions.find((o) => o.value === val)!.href)}
    >
      <SelectTrigger className="w-full @min-2xl:hidden rounded-sm shadow-none">
        <div className="flex items-center gap-1.5">
          <SelectValue placeholder="Option"/>
          {isPending && <LoaderCircle size={16} className="animate-spin"/>}
        </div>
      </SelectTrigger>
      <SelectContent>
        {
          viewOptions.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))
        }
      </SelectContent>
    </Select>
    <Tabs
      orientation="vertical"
      value={activeSection}
      onValueChange={(val) => navigateToPath(viewOptions.find((o) => o.value === val)!.href)}
      className="hidden @min-2xl:inline-flex"
    >
      <TabsList className="min-w-50 h-fit bg-transparent p-0 gap-3 rounded-none">
        {
          viewOptions.map((v) => (
            <TabsTrigger
              key={v.value}
              value={v.value}
              disabled={isPending}
              className={cn(
                "cursor-pointer w-full justify-start items-center border border-border data-[state=inactive]:text-muted-foreground py-2 px-4 rounded-sm",
                "data-[state=active]:pointer-events-none data-[state=active]:shadow-none data-[state=active]:border-none data-[state=active]:text-white data-[state=active]:bg-mealicious-primary!",
                "disabled:cursor-not-allowed disabled:text-muted"
              )}
            >
              <v.icon />
              {v.label}
            </TabsTrigger>
          ))
        }
      </TabsList>
    </Tabs>
    </>
  );
}
