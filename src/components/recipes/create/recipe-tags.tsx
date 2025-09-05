import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CreateRecipeFormSchema, MAX_RECIPE_TAGS_LENGTH } from "@/lib/zod/recipe";
import { Info } from "lucide-react";
import { ComponentProps, useCallback, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";
import { Separator } from "@/components/ui/separator";

const TagsSchema = CreateRecipeFormSchema.shape.tags;

export default function RecipeTags({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const [touched, setTouched] = useState(false);
  const [tag, setTag] = useState<string>("");

  const { control, setValue } = useCreateRecipeFormContext();
  const { 
    errors: {
      tags: tagsError
    }
  } = useFormState({ control, name: "tags" });
  const formTags = useWatch({ control, name: "tags" });

  const tagListValidation = TagsSchema.safeParse([...formTags, tag]); // include current tag input
  const errors = tagListValidation.error ? tagListValidation.error.issues : [];

  const setTagInput = useCallback((input: string) => {
    setTag(input);
    setTouched(!!input);
  }, [setTag, setTouched]);
  
  return (
    <section 
      {...props}
      className={cn(
        "flex flex-col gap-1.5",
        className
      )}
    >
      <h1 className="text-2xl font-bold">Tags</h1>
      <div className="error-text text-sm has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{tagsError?.message}</span>
      </div>
      <div className="flex justify-between items-stretch gap-3">
        <Input 
          value={tag}
          placeholder="Tag"
          onChange={(e) => setTagInput(e.target.value)}
          className="h-9 rounded-sm shadow-none"
        />
        <button
          disabled={!touched || errors.length > 0}
          onClick={() => {
            setValue(
              "tags",
              [...formTags, tag],
              { shouldDirty: true }
            );
            setTagInput("");
          }}
          className="mealicious-button h-9 font-semibold text-sm px-6 py-1.5 rounded-sm"
        >
          Add
        </button>
      </div>
      <div className="error-label flex flex-col gap-2 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2">
          <Info size={14}/>
          <span className="font-bold text-sm">Errors</span>
        </div>
        <Separator className="bg-primary/33 dark:bg-border"/>
        <ul className="flex flex-col gap-1">
          {
            touched && errors.map((i) => (
              <li key={i.path.join("-")} className="text-xs list-inside list-disc">
                {i.message}
              </li>
            ))
          }
        </ul>
      </div>
      <div className="flex flex-col gap-1.5 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          You can remove a tag by clicking on it.
        </div>
        <ul className="flex flex-wrap gap-x-1 gap-y-2">
          {
            formTags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setValue(
                    "tags",
                    [...formTags.filter((ft) => ft !== t)],
                    { shouldDirty: true }
                  )}
                  className="mealicious-button text-white text-xs font-semibold min-w-12 hover:bg-red-500 hover:text-white px-3 py-1 rounded-full transition-colors"
                >
                  {t}
                </button>
              </li>
            ))
          }
        </ul>
      </div>
      <div className="flex flex-col items-start">
        <p className="font-semibold text-muted-foreground text-sm">
          Add extra tags to your recipe here. (optional)
        </p>
        <span className={cn(
          "shrink-0 text-sm",
          formTags.length > MAX_RECIPE_TAGS_LENGTH && "text-red-500"
        )}>
          <b className="text-base">{formTags.length}</b> / {MAX_RECIPE_TAGS_LENGTH}
        </span>
      </div>
    </section>
  );
}
