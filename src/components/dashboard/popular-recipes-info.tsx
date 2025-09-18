"use client";

import { PopularRecipe } from "@/lib/zod/dashboard";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem
} from "@/components/ui/carousel";
import { useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useContainerQuery } from "@/hooks/use-container-query";
import { remToPx } from "@/lib/utils";

type PopularRecipesInfoProps = {
  popularRecipes: PopularRecipe[];
};

const CONTAINER_2XL_BREAKPOINT = 32;

export default function PopularRecipesInfo({ popularRecipes }: PopularRecipesInfoProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [ref, matches] = useContainerQuery<HTMLDivElement>({
    condition: ({ width }) => width < remToPx(CONTAINER_2XL_BREAKPOINT)
  });

  return (
    <Carousel 
      ref={ref}
      setApi={setApi}
      opts={{
        loop: true,
        watchDrag: matches
      }}
    >
      <CarouselContent>
        {
          popularRecipes.map((r) => (
            <CarouselItem key={r.id} className="basis-full">
              <div className="min-h-75 max-w-full h-full dark:bg-sidebar/50 border border-border flex flex-col-reverse @min-2xl:flex-row rounded-md overflow-hidden">
                <div className="flex-auto @min-2xl:flex-1 flex flex-col gap-2 p-4 overflow-hidden">
                  <h2 className="font-bold text-xl hyphens-auto line-clamp-2 @min-6xl:line-clamp-1">{r.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 empty:hidden">
                    {
                      r.diets.map((d) => (
                        <div 
                          key={d.id}
                          className="bg-mealicious-primary text-white font-semibold text-xs py-1 px-2.5 rounded-full"
                        >
                          {d.name}
                        </div>
                      ))
                    }
                  </div>
                  <div className="flex items-center gap-3 h-6">
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <Flame size={14} className="fill-primary"/>
                      <span>{r.calories.toLocaleString()} Calories</span>
                    </div>
                    <Separator orientation="vertical"/>
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <Clock size={14}/>
                      <span>{Math.floor(r.prepTime)} min</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm hyphens-auto line-clamp-3">{r.description}</p>
                  <div className="flex justify-between items-center gap-2 mt-auto">
                    <Link
                      href={`/recipes/${r.id}`}
                      className="mealicious-button font-semibold text-sm flex items-center gap-2 py-1.5 px-3 rounded-full"
                    >
                      View Recipe
                      <ArrowRight size={16}/>
                    </Link>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => api?.scrollPrev()}
                        disabled={!api?.canScrollPrev()}
                        className="cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground hover:bg-muted size-10 @min-4xl:size-auto font-semibold text-sm border border-border flex justify-center items-center gap-2 py-1.5 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground transition-colors"
                      >
                        <ArrowLeft size={16}/>
                        <span className="hidden @min-4xl:block">Previous</span>
                      </button>
                      <button 
                        onClick={() => api?.scrollNext()}
                        disabled={!api?.canScrollNext()}
                        className="cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground hover:bg-muted size-10 @min-4xl:size-auto font-semibold text-sm border border-border flex justify-center items-center gap-2 py-1.5 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground transition-colors"
                      >
                        <span className="hidden @min-4xl:block">Next</span>
                        <ArrowRight size={16}/>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="@min-2xl:flex-1 relative h-56 @min-2xl:h-auto">
                  <Image
                    src={r.image}
                    alt={`Image of ${r.title}`}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute size-full bg-linear-to-t from-slate-950/50 from-5% to-white/0 to-50%"/>
                  <div className="absolute bottom-4 right-4 text-black bg-white opacity-85 backdrop-blur-sm font-semibold text-sm flex items-center gap-2.5 py-1.5 px-4 rounded-full">
                    <span className="text-nowrap">{r.saveCount} {r.saveCount !== 1 ? "Saves" : "Save"}</span>
                    <ArrowDownToLine size={16}/>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))
        }
      </CarouselContent>
    </Carousel>
  );
}
