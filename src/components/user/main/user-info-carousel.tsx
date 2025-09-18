"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, SearchX } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Route } from "next";

type UserInfoCarouselProps = {
  header: string;
  href: Route;
  items: React.ReactElement<React.HTMLAttributes<HTMLDivElement>, "div">[];
}

export default function UserInfoCarousel({ header, href, items }: UserInfoCarouselProps) {
  if (items.length === 0) {
    return (
      <section className="flex flex-col justify-center gap-2">
        <h1 className="font-bold text-lg">{header}</h1>
        <div className="border border-border bg-sidebar min-h-72 flex flex-col justify-center items-center gap-4 py-12 rounded-md">
          <SearchX size={48} className="stroke-muted-foreground"/>
          <h3 className="font-bold text-lg">Nothing here yet...</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-2">
      <h1 className="font-bold text-lg">{header}</h1>
      <Carousel
        opts={{
          skipSnaps: true,
          containScroll: "keepSnaps",
          slidesToScroll: "auto",
        }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-4">
          <CarouselPrevious className="static top-0 left-0 translate-x-0 translate-y-0"/>
          <CarouselNext className="static top-0 left-0 translate-x-0 translate-y-0"/>
          <Button variant="link" className="cursor-pointer p-0 ml-auto">
            <Link href={href} className="flex items-center gap-2">
              More {header}
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <CarouselContent>
          {
            items.map((item, index) => (
              <CarouselItem key={`item-${index + 1}`} className="basis-full @min-xl:basis-1/2">
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
      <Skeleton className="h-60 rounded-md"/>
    </section>
  );
}
