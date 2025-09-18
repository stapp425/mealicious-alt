"use client";

import { MostRecentSavedRecipe } from "@/lib/zod/dashboard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import Image from "next/image";
import { ArrowRight, Clock, Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useHydration } from "@/hooks/use-hydration";
import { useContainerQuery } from "@/hooks/use-container-query";
import { remToPx } from "@/lib/utils";

type MostRecentSavedRecipesInfoProps = {
  savedRecipes: MostRecentSavedRecipe[];
};

const CAROUSEL_BREAKPOINT = 32;

export default function MostRecentSavedRecipesInfo({ savedRecipes }: MostRecentSavedRecipesInfoProps) {
  const hydrated = useHydration();
  const [ref, matches] = useContainerQuery<HTMLDivElement>({
    condition: ({ width }) => width >= remToPx(CAROUSEL_BREAKPOINT)
  });
  
  return (
    <Carousel
      ref={ref}
      opts={{
        watchDrag: !matches,
        slidesToScroll: "auto"
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CarouselPrevious className="static top-0 left-0 translate-x-0 translate-y-0"/>
        <CarouselNext className="static top-0 left-0 translate-x-0 translate-y-0"/>
        <Link href="/recipes" className="ml-auto">
          <Button variant="link" className="cursor-pointer p-0!">
            More Saved Recipes
            <ArrowRight />
          </Button>
        </Link>
      </div>
      <CarouselContent>
        {
          savedRecipes.map((r) => (
            <CarouselItem key={r.id} className="basis-full @min-2xl:basis-1/2 @min-6xl:basis-1/3">
              <div className="h-full dark:bg-sidebar/50 border border-border flex flex-col gap-2 @min-2xl:gap-2.5 p-4 rounded-md overflow-hidden">
                <div className="relative h-46 @min-2xl:h-56 rounded-sm overflow-hidden">
                  <Image 
                    src={r.image}
                    alt={`Image of ${r.title}`}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute size-full bg-linear-to-t from-gray-700/10 from-5% to-white/0 to-30%"/>
                </div>
                <h3 className="font-bold hyphens-auto line-clamp-2 text-lg">{r.title}</h3>
                <div className="flex items-center gap-3 h-6">
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
                <p className="text-muted-foreground line-clamp-3 text-sm empty:hidden">{r.description}</p>
                <Link 
                  href={`/recipes/${r.id}`}
                  className="w-fit mealicious-button font-semibold text-xs flex items-center gap-2 mt-auto py-1.75 px-3.5 rounded-full"
                >
                  View Recipe <ArrowRight size={hydrated && matches ? 18 : 16}/>
                </Link>
              </div>
            </CarouselItem> 
          ))
        }
      </CarouselContent>
    </Carousel>
  );
}
