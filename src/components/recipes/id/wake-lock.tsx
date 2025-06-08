"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useWakeLock } from "react-screen-wake-lock";

export default function WakeLock() {
  const [isWakeLockEnabled, setIsWakeLockEnabled] = useState<boolean>(false);
  const { isSupported, request, release, released } = useWakeLock();

  useEffect(() => {
    const releaseWakeLock = () => {
      if (!released) {
        release().catch((err) => {
          console.error("Failed to release wake lock", err);
        });
      }
    };

    return releaseWakeLock;
  }, []);
  
  if (!isSupported)
    return null;

  return (
    <div className="border border-border w-fit flex items-center gap-4 py-2.5 px-4 rounded-sm">
      <Switch
        id="cook-mode"
        checked={isWakeLockEnabled}
        onCheckedChange={async (val) => {
          setIsWakeLockEnabled(val === true);
          if (val === true) {
            await request();
          } else {
            if (!released)
              await release();
          }
        }}
      />
      <div className="flex flex-col gap-0.5">
        <Label htmlFor="cook-mode">Cook Mode</Label>
        <span className="text-muted-foreground text-xs">(Keeps screen awake)</span>
      </div>
    </div>
  );
}
