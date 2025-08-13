"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { ChangeHandler } from "react-hook-form";

type PasswordInputProps = {
  id: string;
  onChange: ChangeHandler;
  onBlur: ChangeHandler;
  name: string;
};

export default function PasswordInput({ id, className, ...props }: PasswordInputProps & React.ComponentProps<"input">) {
  const [empty, setEmpty] = useState(!props.value);
  const [visible, setVisible] = useState(false);
  const Icon = visible ? Eye : EyeOff;

  return (
    <div className="h-9 relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        placeholder="Password"
        maxLength={20}
        className={cn("h-full", className)}
        {...props}
        onChange={(e) => {
          props?.onChange(e);
          setEmpty(!e.target.value);
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={cn(
          empty && "hidden",
          "absolute top-1/2 -translate-y-1/2 p-0 right-3 password-toggle-icon"
        )}
      >
        <Icon size={16} strokeWidth={1}/>
      </button>
    </div>
  );
}
