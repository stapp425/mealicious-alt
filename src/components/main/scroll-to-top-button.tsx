"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollToTopButton() {
  const [y, setY] = useState<number>(0);
  const handleScroll = () => setY(window.scrollY);

  useEffect(() => {
    setY(window.scrollY);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      id="scroll-button"
      onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        y > 100 ? "opacity-100" : "opacity-0 pointer-events-none",
        "fixed bottom-4 right-4 flex justify-center items-center mealicious-button rounded-full size-14 p-0 shadow-xl"
      )}
    >
      <ArrowUp size={28}/>
    </button>
  );
}