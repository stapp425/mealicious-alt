"use client";

import { UpcomingPlan } from "@/lib/zod/dashboard";
import { useEffect, useState } from "react";
import { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Calendar, Clock, Flame, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import Link from "next/link";
import { useContainerQuery } from "@/hooks/use-container-query";
import { useHydration } from "@/hooks/use-hydration";
import { cn, remToPx } from "@/lib/utils";

type UpcomingPlanInfoProps = {
  upcomingPlan: UpcomingPlan;
};

const CONTAINER_BREAKPOINT = 32;
const inUtc = { in: tz("UTC") };

export default function UpcomingPlanInfo({ upcomingPlan }: UpcomingPlanInfoProps) {
  const hydrated = useHydration();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [ref, matches] = useContainerQuery<HTMLDivElement>({
    condition: ({ width }) => width >= remToPx(CONTAINER_BREAKPOINT)
  });

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap()); // index starts at 1
    setCount(api.slideNodes().length);

    api.on("select", (emblaApi) => {
      setCurrent(emblaApi.selectedScrollSnap());
    });
  }, [api, setCurrent, setCount]);

  const selectedMeal = upcomingPlan.meals[current];

  return (
    <div
      ref={ref}
      className="grid gap-2"
    >
      <div className="w-fit font-semibold text-sm flex items-center mb-1 overflow-hidden">
        <div className="border border-mealicious-primary bg-mealicious-primary text-white border-r border-r-border flex items-center gap-2 py-2 px-3 rounded-l-sm">
          <span className="font-bold uppercase tracking-wider -mb-0.5">
            {format(upcomingPlan.date, "E", inUtc)}
          </span>
          <Calendar size={16}/>
        </div>
        <div className="dark:bg-sidebar border border-l-0 border-border rounded-r-sm py-2 px-3">
          <span className="-mb-0.5">{format(upcomingPlan.date, "MMMM do, yyyy", inUtc)}</span>
        </div>
      </div>
      <div className="flex flex-col @min-2xl:flex-row justify-between items-start @min-2xl:items-center gap-2.5">
        <h1 className="text-2xl font-bold -mb-1">{upcomingPlan.title}</h1>
        <div className="flex items-center gap-2">
          <Link 
            href="/plans"
            className="flex-1 @min-2xl:flex-auto mealicious-button font-semibold text-center text-xs @min-2xl:text-sm text-nowrap flex justify-center items-center gap-2 py-2 px-4 rounded-full transition-colors"
          >
            Plan Calendar
            <ArrowRight size={14}/>
          </Link>
          <Link 
            href={`/plans/${upcomingPlan.id}/edit`}
            className="flex-1 @min-2xl:flex-auto mealicious-button font-semibold text-center text-xs @min-2xl:text-sm text-nowrap flex justify-center items-center gap-2 py-2 px-4 rounded-full transition-colors"
          >
            Edit Plan
            <Pencil size={14}/>
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 empty:hidden">
        {
          upcomingPlan.tags.map((t) => (
            <div
              key={t}
              className="bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3"
            >
              {t}
            </div>
          ))
        }
      </div>
      <p className={cn(
        "text-muted-foreground text-sm text-wrap hyphens-auto truncate",
        !upcomingPlan.description && "italic"
      )}>
        {upcomingPlan.description || "No description is available."}
      </p>
      <div className="grid gap-2.5 mt-4">
        <div className="grid gap-0.5">
          <h1 className="font-bold text-lg">Meals</h1>
          <div className="w-18 h-1.5 bg-mealicious-primary"/>
        </div>
        <div className="grid items-start gap-2.5 overflow-hidden">
          <h3 className="flex-1 font-semibold text-lg text-ellipsis hyphens-auto line-clamp-2 -mb-1">
            {selectedMeal.title}
          </h3>
          <span className="w-fit bg-mealicious-primary uppercase font-semibold tracking-widest text-xs text-white py-1.5 px-3 rounded-full">
            {selectedMeal.type}
          </span>
          <div className="flex justify-between items-end gap-4">
            <div className="w-fit flex items-center gap-2.5">
              <button 
                onClick={() => api?.scrollPrev()}
                disabled={!api?.canScrollPrev()}
                className="size-8 cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground dark:bg-sidebar/50 border border-border flex justify-center items-center gap-2 ml-auto py-2 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground"
              >
                <ArrowLeft size={16}/>
              </button>
              <button 
                onClick={() => api?.scrollNext()}
                disabled={!api?.canScrollNext()}
                className="size-8 cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground dark:bg-sidebar/50 border border-border flex justify-center items-center gap-2 mr-auto py-2 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground"
              >
                <ArrowRight size={16}/>
              </button>
            </div>
            <span className="text-muted-foreground">Meal {current + 1} of {count}</span>
          </div>
        </div>
        <Carousel
          setApi={setApi}
          opts={{
            watchDrag: false
          }}
          className="grid gap-4"
        >
          <CarouselContent>
            {
              upcomingPlan.meals.map((m) => (
                <CarouselItem
                  key={m.type}
                  className="basis-full"
                >
                  <div className="dark:bg-sidebar/50 border border-border flex flex-col rounded-md">
                    <div className="border-b border-b-border grid gap-1.5 p-4 overflow-hidden">
                      <h3 className="font-bold text-lg hyphens-auto line-clamp-2 -mb-0.5">{m.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 empty:hidden">
                        {
                          m.tags.map((t) => (
                            <div 
                              key={t}
                              className="bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3"
                            >
                              {t}
                            </div>
                          ))
                        }
                      </div>
                      <p className={cn(
                        "text-muted-foreground text-sm text-wrap hyphens-auto truncate",
                        !m.description && "italic"
                      )}>
                        {m.description || "No description is available."}
                      </p>
                    </div>
                    <Carousel
                      opts={{
                        slidesToScroll: "auto",
                        watchDrag: !matches
                      }}
                      className="p-4"
                    >
                      <div className="flex justify-between items-center gap-2 mb-4">
                        <h3 className="font-bold text-lg">Recipes</h3>
                        <div className="flex items-center gap-2">
                          <CarouselPrevious className="static top-0 left-0 translate-x-0 translate-y-0"/>
                          <CarouselNext className="static top-0 left-0 translate-x-0 translate-y-0"/>
                        </div>
                      </div>
                      <CarouselContent>
                        {
                          m.recipes.map((r) => (
                            <CarouselItem
                              key={r.id}
                              className="basis-full @min-2xl:basis-1/2 @min-6xl:basis-1/3"
                            >
                              <div className="h-full flex flex-col gap-2 @min-2xl:gap-2.5 rounded-md overflow-hidden">
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
                                <div className="flex flex-wrap items-center gap-2 empty:hidden">
                                  {
                                    r.diets.map((d) => (
                                      <div 
                                        key={d.id}
                                        className="bg-mealicious-primary text-white font-semibold text-xs rounded-full py-1 px-3"
                                      >
                                        {d.name}
                                      </div>
                                    ))
                                  }
                                </div>
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
                  </div>
                </CarouselItem>
              ))
            }
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
