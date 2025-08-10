"use client";

import { MostRecentSavedRecipe } from "@/lib/zod/dashboard";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { useMediaQuery } from "usehooks-ts";
import Image from "next/image";
import { ArrowRight, Clock, Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getDateDifference } from "@/lib/utils";
import { Button } from "../ui/button";

type MostRecentSavedRecipesInfoProps = {
  savedRecipes: MostRecentSavedRecipe[];
};

export default function MostRecentSavedRecipesInfo({ savedRecipes }: MostRecentSavedRecipesInfoProps) {
  const [mounted, setMounted] = useState(false);
  const _sm = useMediaQuery("(min-width: 40rem)");
  const _2xl = useMediaQuery("(min-width: 96rem)");

  useEffect(
    () => setMounted(true),
    [setMounted]
  );

  const slidesToScroll = _sm
    ? _2xl ? 4 : 2
    : 1;
  
  return (
    <Carousel
      opts={{
        watchDrag: !_sm,
        slidesToScroll
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CarouselPrevious className="static top-0 left-0 translate-x-0 translate-y-0"/>
        <CarouselNext className="static top-0 left-0 translate-x-0 translate-y-0"/>
        <Link href="/recipes" className="ml-auto">
          <Button variant="ghost" className="cursor-pointer">
            More Saved Recipes
            <ArrowRight />
          </Button>
        </Link>
      </div>
      <CarouselContent className="">
        {
          savedRecipes.map((r) => (
            <CarouselItem key={r.id} className="basis-full sm:basis-1/2 2xl:basis-1/4">
              <div className="border border-border bg-sidebar/50 h-full flex flex-col gap-1.5 sm:gap-2.5 p-3 sm:p-4 rounded-md overflow-hidden">
                <div className="relative h-[150px] sm:h-[225px] rounded-sm overflow-hidden">
                  <Image 
                    src={r.image}
                    alt={`Image of ${r.title}`}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute size-full bg-linear-to-t from-slate-700/10 from-5% to-white/0 to-30%"/>
                </div>
                <h3 className="font-bold hyphens-auto line-clamp-2">{r.title}</h3>
                <p className="text-muted-foreground line-clamp-3 empty:hidden">{r.description}</p>
                <div className="flex items-center gap-3 h-[25px]">
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <Flame size={14} fill="var(--primary)"/>
                    <span>{r.calories.toLocaleString()} Calories</span>
                  </div>
                  <Separator orientation="vertical"/>
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <Clock size={14}/>
                    <span>{Math.floor(r.prepTime)} min</span>
                  </div>
                </div>
                <i className="text-muted-foreground text-sm">
                  Saved {getDateDifference({ earlierDate: r.saveDate })} ago
                </i>
                <Link 
                  href={`/recipes/${r.id}`}
                  className="w-fit mealicious-button font-semibold text-xs sm:text-sm flex items-center gap-2 mt-auto py-2 px-3 rounded-full"
                >
                  Go to Recipe <ArrowRight size={mounted && _sm ? 18 : 16}/>
                </Link>
              </div>
            </CarouselItem> 
          ))
        }
      </CarouselContent>
    </Carousel>
  );
}
