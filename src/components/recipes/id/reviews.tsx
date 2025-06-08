"use client";

import { Separator } from "@/components/ui/separator";

type ReviewsProps = {
  statistics: {
    fiveStarCount: number;
    fourStarCount: number;
    threeStarCount: number;
    twoStarCount: number;
    oneStarCount: number;
  };
  reviews: {
    id: string;
    content: string | null;
    createdAt: Date;
    updatedAt: Date;
    rating: number;
    likeCount: number | null;
    creator: {
      image: string | null;
      id: string;
      email: string;
      name: string;
    } | null;
  }[];
};

export default function Reviews({ statistics, reviews }: ReviewsProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-bold text-xl">Reviews</h2>
      <Separator />
      {
        reviews.map((r) => (
          <div key={r.id} className="bg-sidebar border border-border">
            <div>
              
            </div>
          </div>
        ))
      }
    </section>
  );
}
