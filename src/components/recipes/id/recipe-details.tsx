"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Earth, Medal, Microwave, Clipboard } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Description from "@/components/recipes/id/description";
import { Favorite } from "@/components/recipes/id/options";
import { Separator } from "@/components/ui/separator";
import Cuisine from "@/components/recipes/id/cuisine";
import Diets from "@/components/recipes/id/diets";
import DishTypes from "@/components/recipes/id/dish-types";
import Instructions from "@/components/recipes/id/instructions";
import Tags from "@/components/recipes/id/tags";
import defaultImage from "@/img/default/default-background.jpg";
import defaultProfilePicture from "@/img/default/default-pfp.svg";

type RecipeDetailsProps = {
  isAuthor: boolean;
  isSaved: boolean;
  isFavorited: boolean;
  recipe: {
    id: string;
    title: string;
    image: string | null;
    creator: {
      id: string;
      name: string;
      image: string | null;
    } | null;
    createdAt: Date;
    description: string | null;
    tags: string[];
    createdBy: string | null;
    updatedAt: Date;
    sourceName: string | null;
    sourceUrl: string | null;
    savedBy: {
      saveDate: Date;
    }[];
    prepTime: string;
    cookTime: string;
    readyTime: string;
    cuisine: {
      id: string;
      description: string;
      adjective: string;
      countryOrigins: {
        country: {
          id: string;
          icon: string;
        };
      }[];
    } | null;
    diets: {
      diet: {
        name: string;
        id: string;
        description: string | null;
      };
    }[];
    dishTypes: {
      dishType: {
        name: string;
        id: string;
        description: string;
      }
    }[];
    instructions: {
      id: string;
      title: string;
      time: string;
      index: number;
      description: string;
    }[];
  }
};

export default function RecipeDetails({ isAuthor, isSaved, isFavorited, recipe }: RecipeDetailsProps) {
  const printContent = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={printContent} className="relative bg-background flex flex-col gap-3 w-full min-h-full max-w-[750px] mx-auto p-4 shadow-2xl">
      <div className="relative w-full h-[300px] sm:h-[400px]">
        <Image 
          src={recipe.image || defaultImage}
          alt={`Image of ${recipe.title}`}
          fill
          className="relative border border-border object-cover rounded-sm"
        />
        <h1 className="absolute bottom-3 left-3 right-3 w-fit max-w-full bg-background text-wrap hyphens-none line-clamp-2 font-bold text-xl text-foreground rounded-sm py-2 px-4 shadow-md">
          {recipe.title}
        </h1>
        {
          (recipe.sourceName && recipe.sourceUrl) && (
            <Link 
              href={recipe.sourceUrl}
              target="_blank"
              className="absolute top-3 left-3 max-w-[150px] bg-background text-foreground font-semibold text-sm flex items-center gap-2 py-1.5 px-3 rounded-sm shadow-md"
            >
              <Earth size={16}/>
              <span className="truncate underline">{recipe.sourceName}</span>
            </Link>
          )
        }
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap items-start md:items-stretch gap-2">
        {
          isAuthor && (
            <div className="flex-1 w-full flex justify-center items-center gap-5 text-orange-400 border border-orange-400 text-sm font-semibold py-2 px-4 rounded-sm">
              <Medal size={28}/>
              <div className="flex flex-col items-start">
                You created this recipe
                <i className="text-xs">Last updated on {format(recipe.updatedAt, "MMM d, yyyy")}</i>
              </div>
            </div>
          )
        }
        {
          isSaved && (
            <div className="flex-1 w-full font-semibold flex justify-center items-center gap-5 text-green-600 border border-green-600 text-sm py-2 px-4 rounded-sm">
              <Check size={28}/>
              <div className="flex flex-col items-start">
                You have this recipe saved
                <i className="text-xs">Recipe saved on {format(recipe.savedBy[0].saveDate, "MMM d, yyyy")}</i>
              </div>
            </div>
          )
        }
      </div>
      <section className="flex flex-col gap-3">
        <h1 className="font-bold text-xl">Author</h1>
        <div className="flex items-center gap-3">
          <Avatar className="size-[50px]">
            <AvatarImage
              src={recipe.creator?.image || defaultProfilePicture}
              alt={`Profile picture of ${recipe.creator?.name || "[deleted]"}`}
            />
            <AvatarFallback>{recipe.creator?.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-between items-start">
            {
              recipe.creator ? (
                <Link href={`/user/${recipe.creator.id}`} className="font-semibold">
                  {recipe.creator.name}
                </Link>
              ) : (
                <h2 className="text-muted-foreground italic">
                  [deleted]
                </h2>
              )
            }
            <span className="italic text-muted-foreground text-sm">
              Recipe created on {format(recipe.createdAt, "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <Description description={recipe.description}/>
      </section>
      <Favorite 
        recipeId={recipe.id}
        isRecipeFavorite={isFavorited}
      />
      <div className="bg-mealicious-primary text-white border border-border h-[100px] flex justify-between rounded-md">
        <div className="flex-1 flex flex-col justify-between items-center py-2">
          <Clock size={28}/>
          <h3>{Number(recipe.prepTime)} min</h3>
          <h2 className="font-bold">Prep Time</h2>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex flex-col justify-between items-center py-2">
          <Microwave size={28}/>
          <h3>{Number(recipe.cookTime)} min</h3>
          <h2 className="font-bold">Cook Time</h2>
        </div>
        <Separator orientation="vertical"/>
        <div className="flex-1 flex flex-col justify-between items-center py-2">
          <Clipboard size={28}/>
          <h3>{Number(recipe.readyTime)} min</h3>
          <h2 className="font-bold">Ready Time</h2>
        </div>
      </div>
      {recipe.cuisine && <Cuisine cuisine={recipe.cuisine}/>}
      {recipe.diets.length > 0 && <Diets diets={recipe.diets.map(({ diet }) => diet)}/>}
      {recipe.dishTypes.length > 0 && <DishTypes dishTypes={recipe.dishTypes.map(({ dishType }) => dishType)} />}
      {recipe.tags.length > 0 && <Tags tags={recipe.tags} />}
      <Instructions instructions={recipe.instructions}/>
    </div>
  );
}