import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_MEAL_TITLE_LENGTH } from "@/lib/zod/meal";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useCreateMealFormContext } from "@/components/meals/create/create-meal-form";

export default function MealTitle() {
  const { control, register } = useCreateMealFormContext();
  const title = useWatch({ control, name: "title" });
  const {
    errors: {
      title: titleError
    }
  } = useFormState({ control, name: "title" });
  
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="required-field font-bold text-2xl">
        Title
      </h2>
      <div className="flex flex-col @min-3xl:flex-row justify-between items-start @min-3xl:items-center">
        <p className="font-semibold text-muted-foreground text-sm">
          Add a title to your meal here.
        </p>
        <span className={cn("shrink-0 text-sm", title.length > MAX_MEAL_TITLE_LENGTH && "text-red-500")}>
          <b className="text-base">{title.length}</b> / {MAX_MEAL_TITLE_LENGTH}
        </span>
      </div>
      <Input
        {...register("title")}
        placeholder="Title"
        className="rounded-sm shadow-none"
      />
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{titleError?.message}</span>
      </div>
    </section>
  );
}
