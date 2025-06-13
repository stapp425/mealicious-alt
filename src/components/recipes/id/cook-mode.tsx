"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useWakeLock } from "react-screen-wake-lock";

export default function CookMode() {
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
    <div className="border border-border w-fit flex items-center gap-4 py-2.5 px-4 rounded-sm">
      <Switch
        id="cook-mode"
        checked={isWakeLockEnabled}
        onCheckedChange={async (val) => {
          if (val === true) 
            await request();
          else 
            await release();
        }}
      />
      <div className="flex flex-col gap-0.5">
        <Label htmlFor="cook-mode">Cook Mode</Label>
        <span className="text-muted-foreground text-xs">(Keeps screen awake)</span>
      </div>
    </div>
  );
}
