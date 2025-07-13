"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

type ScrollToTopButtonProps = {
  visibilityThreshold?: number;
};

export default function ScrollToTopButton({ visibilityThreshold = 100 }: ScrollToTopButtonProps) {
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
      id="scroll-button"
      onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        scrolled ? "opacity-100" : "opacity-0 pointer-events-none",
        "fixed bottom-4 right-4 flex justify-center items-center mealicious-button rounded-full size-14 p-0 shadow-xl"
      )}
    >
      <ArrowUp size={28}/>
    </button>
  );
}