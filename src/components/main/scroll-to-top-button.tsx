"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { ComponentProps, useEffect, useState } from "react";

export default function ScrollToTopButton({ 
  id = "scroll-button",
  visibilityThreshold = 100,
  onClick,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  visibilityThreshold?: number;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrolled(position > visibilityThreshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibilityThreshold]);

  return (
    <button
      id={id}
      onClick={(e) => {
        scrollTo({ top: 0, behavior: "smooth" });
        onClick?.(e);
      }}
      className={cn(
        scrolled ? "opacity-100" : "opacity-0 pointer-events-none",
        "fixed bottom-4 right-4 flex justify-center items-center mealicious-button rounded-full size-14 p-0 shadow-xl",
        className
      )}
      {...props}
    >
      <ArrowUp size={28}/>
    </button>
  );
}