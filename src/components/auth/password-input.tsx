"use client";

import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { ChangeHandler } from "react-hook-form";

type PasswordInputProps = {
  id: string;
  onChange: ChangeHandler;
  onBlur: ChangeHandler;
  name: string;
  isInputEmpty: boolean;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ id, isInputEmpty, ...props }, ref) => {
  const [visible, setVisible] = useState<boolean>(false);
  const Icon = visible ? Eye : EyeOff;

  return (
    <div className="h-9 relative">
      <Input
        ref={ref}
        id={id}
        type={visible ? "text" : "password"}
        placeholder="Password"
        className="h-full"
        {...props}
      />
      {
        !isInputEmpty && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1/2 -translate-y-1/2 p-0 right-3 password-toggle-icon"
          >
            <Icon size={20} strokeWidth={1}/>
          </button>
        )
      }
    </div>
  )
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;