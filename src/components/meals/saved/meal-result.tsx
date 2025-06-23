"use client";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteMeal } from "@/lib/actions/db";
import { cn } from "@/lib/utils";
import { EllipsisVertical, Flame, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type MealResultProps = {
  meal: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    tags: string[];
    calories: number;
    recipes: {
      id: string;
      title: string;
      image: string;
      description: string | null;
    }[];
  };
};

export default function MealResult({ meal }: MealResultProps) {
  const { refresh } = useRouter();
  const { executeAsync, isExecuting } = useAction(deleteMeal, {
    onSuccess: ({ data }) => {
      refresh();
      toast.warning(data?.message);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <div className="field-container flex flex-col justify-start gap-3">
      <div className="flex justify-between items-start gap-3">
        <h1 className="font-bold text-3xl line-clamp-2">{meal.title}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer mt-1.5">
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/meals/${meal.id}/edit`}
                className="cursor-pointer"
              >
                Edit
                <Pencil size={16}/>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <AlertDialog>
                <AlertDialogTrigger className="hover:bg-accent cursor-pointer w-full flex justify-between items-center text-sm px-2 py-1.5 rounded-sm">
                  Delete
                  <Trash2 size={16} className="text-muted-foreground"/>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deleting this meal is an irreversible action! The recipes contained in this meal will still remain in the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <Button
                      onClick={async () => await executeAsync({ mealId: meal.id })}
                      disabled={isExecuting}
                      variant="destructive"
                      className="min-w-[75px] cursor-pointer"
                    >
                      {isExecuting ? <Loader2 className="animate-spin"/> : "Continue"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
        <Flame size={16} fill="var(--muted-foreground)"/>
        {Number(meal.calories).toLocaleString()} Calories
      </div>
      {
        meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {
              meal.tags.map((t) => (
                <div key={t} className="bg-mealicious-primary text-white text-xs font-semibold min-w-[50px] px-3 py-1 rounded-full">
                  {t}
                </div>
              ))
            }
          </div>
        )
      }
      <p className={cn(
        meal.description ? "line-clamp-1" : "italic",
        "text-muted-foreground"
      )}>
        {meal.description || "No description is available."}
      </p>
      <div className="flex flex-col gap-2.5">
        {
          meal.recipes.map((r) => (
            <div key={r.id} className="border border-border flex justify-between gap-4 p-3 rounded-md">
              <div className="relative min-h-[50px] w-[100px]">
                <Image 
                  src={r.image}
                  alt={`Image of ${r.title}`}
                  fill
                  className="object-cover object-center rounded-sm"
                />
              </div>
              <div className="flex-1 flex flex-col items-start gap-1.5">
                <div className="w-full flex justify-between items-start gap-2">
                  <h2 className="font-bold line-clamp-2">{r.title}</h2>
                  <Link
                    href={`/recipes/${r.id}`}
                    className="text-muted-foreground py-1 px-0.5"
                  >
                    <Search size={16}/>
                  </Link>
                </div>
                <p className={cn(
                  r.description ? "line-clamp-1" : "italic",
                  "text-muted-foreground"
                )}>
                  {r.description || "No description is available."}
                </p>
              </div>
            </div>
          ))
        }
      </div>
      <div className="min-w-[150px] w-fit bg-mealicious-primary tracking-wider text-white text-center font-bold mx-auto mt-auto py-1 px-5 rounded-full">
        {meal.type.toUpperCase()}
      </div>
    </div>
  );
}
