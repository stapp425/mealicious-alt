"use client";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteMeal } from "@/lib/actions/meal";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { EllipsisVertical, Flame, Loader2, Pencil, Trash2 } from "lucide-react";
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
  const queryClient = useQueryClient();
  const { refresh } = useRouter();
  const { execute, isExecuting } = useAction(deleteMeal, {
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({
        queryKey: ["plan-form-meal-results"]
      });
      toast.warning(data.message);
      refresh();
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });
  
  return (
    <div className="border border-mealicious-primary/75 grid gap-2.5 p-4 rounded-md">
      <div className="overflow-hidden flex justify-between items-start gap-3">
        <h1 className="font-bold text-2xl line-clamp-2 hyphens-auto -mb-1.5">{meal.title}</h1>
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
                    <AlertDialogCancel className="cursor-pointer rounded-sm shadow-none">
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      onClick={() => execute({ mealId: meal.id })}
                      disabled={isExecuting}
                      variant="destructive"
                      className="cursor-pointer min-w-18 rounded-sm shadow-none"
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
        <Flame size={16} className="fill-muted-foreground"/>
        {Number(meal.calories).toLocaleString()} Calories
      </div>
      <div className="flex flex-wrap gap-2 empty:hidden">
        {
          meal.tags.map((t) => (
            <div key={t} className="bg-mealicious-primary text-white text-xs font-semibold min-w-12 flex justify-center items-center px-3 py-1 rounded-full">
              {t}
            </div>
          ))
        }
      </div>
      <p className={cn(
        !meal.description && "italic",
        "text-muted-foreground hyphens-auto overflow-hidden"
      )}>
        {meal.description || "No description is available."}
      </p>
      <div className="grid gap-2.5">
        {
          meal.recipes.map((r) => (
            <Link 
              key={r.id}
              href={`/recipes/${r.id}`}
              prefetch={false}
              className="border border-border grid grid-cols-[96px_1fr] gap-4 p-3 rounded-md"
            >
              <div className="relative min-h-16">
                <Image 
                  src={r.image}
                  alt={`Image of ${r.title}`}
                  fill
                  className="object-cover object-center rounded-sm"
                />
                <div className="absolute size-full bg-linear-to-t from-gray-700/10 from-5% to-white/0 to-30%"/>
              </div>
              <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                <h2 className="font-bold line-clamp-2 hyphens-auto">{r.title}</h2>
                <p className={cn(
                  r.description ? "line-clamp-1" : "italic",
                  "text-muted-foreground mt-auto"
                )}>
                  {r.description || "No description is available."}
                </p>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}
