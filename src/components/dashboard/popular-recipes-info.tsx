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
import { useMediaQuery } from "usehooks-ts";

type PopularRecipesInfoProps = {
  popularRecipes: PopularRecipe[];
};

export default function PopularRecipesInfo({ popularRecipes }: PopularRecipesInfoProps) {
  const _sm = useMediaQuery("(min-width: 40rem)");
  const [api, setApi] = useState<CarouselApi>();

  return (
    <Carousel 
      setApi={setApi}
      opts={{
        loop: true,
        watchDrag: !_sm
      }}
    >
      <CarouselContent>
        {
          popularRecipes.map((r) => (
            <CarouselItem key={r.id} className="basis-full">
              <div className="min-h-[300px] max-w-full h-full border border-border flex flex-col-reverse sm:flex-row rounded-md overflow-hidden">
                <div className="flex-auto sm:flex-1 flex flex-col gap-2 p-4">
                  <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-2 mb-1.5">
                    <h2 className="font-bold text-lg line-clamp-2 2xl:line-clamp-1">{r.title}</h2>
                    <div className="font-semibold text-sm border border-border flex items-center gap-2.5 py-1.5 px-4 rounded-full">
                      <span className="text-nowrap">{r.saveCount} {r.saveCount !== 1 ? "Saves" : "Save"}</span>
                      <ArrowDownToLine size={16}/>
                    </div>
                  </div>
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
                  <p className="text-muted-foreground text-sm line-clamp-6">{r.description}</p>
                  <div className="flex justify-between items-center gap-2 mt-auto">
                    <Link
                      href={`/recipes/${r.id}`}
                      className="mealicious-button font-semibold text-sm flex items-center gap-2 py-1.5 px-3 rounded-full"
                    >
                      View Recipe Details
                      <ArrowRight size={16}/>
                    </Link>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => api?.scrollPrev()}
                        disabled={!api?.canScrollPrev()}
                        className="cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground hover:bg-muted size-10 lg:size-auto font-semibold text-sm border border-border flex justify-center items-center gap-2 py-1.5 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground transition-colors"
                      >
                        <ArrowLeft size={16}/>
                        <span className="hidden lg:block">Previous</span>
                      </button>
                      <button 
                        onClick={() => api?.scrollNext()}
                        disabled={!api?.canScrollNext()}
                        className="cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground hover:bg-muted size-10 lg:size-auto font-semibold text-sm border border-border flex justify-center items-center gap-2 py-1.5 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground transition-colors"
                      >
                        <span className="hidden lg:block">Next</span>
                        <ArrowRight size={16}/>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="sm:flex-1 relative h-[225px] sm:h-auto">
                  <Image
                    src={r.image}
                    alt={`Image of ${r.title}`}
                    fill
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </CarouselItem>
          ))
        }
      </CarouselContent>
    </Carousel>
  );
}
