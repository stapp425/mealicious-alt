"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ComponentProps, useEffect, useState } from "react";
import { useWakeLock } from "react-screen-wake-lock";

export default function CookMode({
  className,
  ...props
}: Omit<ComponentProps<"label">, "children">) {
  const [isWakeLockEnabled, setIsWakeLockEnabled] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const { isSupported, request, release } = useWakeLock({
    onRequest: () => setIsWakeLockEnabled(true),
    onRelease: () => setIsWakeLockEnabled(false)
  });

  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!isSupported || !mounted)
    return null;
 
  return (
    <Label 
      className={cn(
        "cursor-pointer border border-border w-fit flex items-center gap-4 py-2.5 px-4 rounded-sm",
        className
      )}
      {...props}
    >
      <Switch
        checked={isWakeLockEnabled}
        onCheckedChange={(val) => {
          if (val === true) request();
          else release();
        }}
      />
      <div className="flex flex-col gap-0.5">
        <span>Cook Mode</span>
        <span className="text-muted-foreground text-xs">Keeps screen awake</span>
      </div>
    </Label>
  );
}
