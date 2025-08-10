"use client";

import { UpcomingPlan } from "@/lib/zod/dashboard";
import { useEffect, useMemo, useState } from "react";
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
import { useMediaQuery } from "usehooks-ts";

type UpcomingPlanInfoProps = {
  upcomingPlan: UpcomingPlan;
};

const inUtc = { in: tz("UTC") };

export default function UpcomingPlanInfo({ upcomingPlan }: UpcomingPlanInfoProps) {
  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const _sm = useMediaQuery("(min-width: 40rem)");
  const _2xl = useMediaQuery("(min-width: 96rem)");

  const slidesToScroll = _sm
    ? _2xl ? 4 : 2
    : 1;

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap()); // index starts at 1
    setCount(api.slideNodes().length);

    api.on("select", (emblaApi) => {
      setCurrent(emblaApi.selectedScrollSnap());
    });
  }, [api]);

  const selectedMeal = useMemo(
    () => upcomingPlan.meals[current],
    [upcomingPlan, current]
  );

  useEffect(
    () => setMounted(true),
    [setMounted]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 mb-3">
        <h1 className="text-3xl font-bold">{upcomingPlan.title}</h1>
        <div className="w-full sm:w-fit flex justify-center items-center gap-2">
          <Link 
            href="/plans"
            className="flex-1 sm:flex-auto mealicious-button font-semibold text-center text-xs sm:text-sm flex justify-center items-center gap-2 py-2 px-4 rounded-full transition-colors"
          >
            Go to Plan Calendar
            <ArrowRight size={14}/>
          </Link>
          <Link 
            href={`/plans/${upcomingPlan.id}/edit`}
            className="flex-1 sm:flex-auto mealicious-button font-semibold text-center text-xs sm:text-sm flex justify-center items-center gap-2 py-2 px-4 rounded-full transition-colors"
          >
            Edit Plan
            <Pencil size={14}/>
          </Link>
        </div>
      </div>
      <div className="w-fit bg-mealicious-primary text-white text-sm font-semibold flex items-center gap-2.5 mb-3 mx-auto sm:mx-0 py-2 pl-2 pr-4 rounded-full">
        <div className="bg-white dark:bg-slate-200 text-black text-xs flex items-center gap-2 py-1.5 px-3 rounded-full">
          <Calendar size={16}/>
          <span className="uppercase">
            {format(upcomingPlan.date, "E", inUtc)}
          </span>
        </div>
        <span>{format(upcomingPlan.date, "MMMM do, yyyy", inUtc)}</span>
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
      <p className="text-muted-foreground empty:hidden mt-2">{upcomingPlan.description}</p>
      <div className="flex flex-col gap-2.5 mt-3">
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
                  <div className="border border-border flex flex-col gap-2 p-4 rounded-md">
                    <h3 className="font-bold text-lg">{m.title}</h3>
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
                    <p className="text-muted-foreground">{m.description}</p>
                    <Carousel 
                      opts={{
                        slidesToScroll,
                        watchDrag: !_sm
                      }}
                      className="mt-6"
                    >
                      <div className="flex justify-between items-center gap-2 mb-2.5">
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
                              className="basis-full sm:basis-1/2 2xl:basis-1/4"
                            >
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
                  </div>
                </CarouselItem>
              ))
            }
          </CarouselContent>
        </Carousel>
        <div className="flex flex-col justify-center items-center gap-2.5 overflow-hidden">
          <div className="flex flex-col items-center gap-1">
            <h3 className="font-semibold text-center max-w-full text-ellipsis line-clamp-2">{selectedMeal.title}</h3>
            <span className="w-fit bg-mealicious-primary uppercase font-semibold tracking-widest text-xs text-white py-2 px-4 rounded-full">
              {selectedMeal.type}
            </span>
            <span className="text-muted-foreground">Meal {current + 1} of {count}</span>
          </div>
          <div className="w-full flex justify-center items-center gap-4">
            <div className="flex-1">
              <button 
                onClick={() => api?.scrollPrev()}
                disabled={!api?.canScrollPrev()}
                className="w-fit cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground border border-border flex items-center gap-2 ml-auto py-2 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground"
              >
                <ArrowLeft size={16}/>
                <span className="font-semibold text-sm max-w-[100px] sm:max-w-[250px] truncate">{current - 1 >= 0 ? upcomingPlan.meals[current - 1].title : "None"}</span>
              </button>
            </div>
            <div className="flex-1">
              <button 
                onClick={() => api?.scrollNext()}
                disabled={!api?.canScrollNext()}
                className="w-fit cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground border border-border flex items-center gap-2 mr-auto py-2 px-3 rounded-full [&>svg]:shrink-0 [&:disabled>svg]:stroke-muted-foreground"
              >
                <span className="font-semibold text-sm max-w-[100px] sm:max-w-[250px] truncate">{current + 1 < upcomingPlan.meals.length ? upcomingPlan.meals[current + 1].title : "None"}</span>
                <ArrowRight size={16}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
