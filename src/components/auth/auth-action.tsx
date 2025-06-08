"use client";

import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type AuthActionProps = {
  children: React.ReactNode;
}

export default function AuthAction({ children }: AuthActionProps) {
  const { data: session, status } = useSession();

  if (status !== "unauthenticated")
    return null;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        
      </DialogContent>
    </Dialog>
  );
}