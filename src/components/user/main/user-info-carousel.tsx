"use client";

import React, { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { ArrowRight, SearchX } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type UserInfoCarousel = {
  header: string;
  href: string;
  items: React.ReactElement<React.HTMLAttributes<HTMLDivElement>, "div">[];
}

export default function UserInfoCarousel({ header, href, items }: UserInfoCarousel) {
  const [mounted, setMounted] = useState(false);
  const matches = useMediaQuery("(min-width: 64rem)");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (items.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-lg">{header}</h1>
        <div className="border border-border bg-sidebar min-h-[250px] flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48}/>
          <h3 className="font-bold text-lg">Nothing here yet...</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h1 className="font-bold text-lg">{header}</h1>
      <Carousel 
        opts={{
          skipSnaps: true,
          containScroll: "keepSnaps",
          slidesToScroll: mounted && matches ? 2 : 1,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CarouselPrevious className="static top-0 left-0 translate-x-0 translate-y-0"/>
          <CarouselNext className="static top-0 left-0 translate-x-0 translate-y-0"/>
          <Link href={href} className="ml-auto">
            <Button variant="ghost" className="cursor-pointer">
              More {header}
              <ArrowRight />
            </Button>
          </Link>
        </div>
        <CarouselContent className="max-w-screen lg:max-w-[750px]">
          {
            items.map((item, index) => (
              <CarouselItem key={`item-${index + 1}`} className="basis-full sm:basis-1/2">
                {item}
              </CarouselItem>
            ))
          }
        </CarouselContent>
      </Carousel>
    </section>
  );
}

export function CarouselSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-8 w-54 rounded-sm"/>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="size-8 rounded-full"/>
        <Skeleton className="size-8 rounded-full"/>
        <Skeleton className="h-8 rounded-md"/>
      </div>
      <Skeleton className="h-[250px] rounded-md"/>
    </section>
  );
}
