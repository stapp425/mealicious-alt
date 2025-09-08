"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EditPlanFormSchema } from "@/lib/zod/plan";
import { Info } from "lucide-react";
import { useFormState, useWatch } from "react-hook-form";
import { useEditPlanFormContext } from "@/components/plans/edit/edit-plan-form";
import { useCallback, useState } from "react";

const TagsSchema = EditPlanFormSchema.shape.tags;

export default function PlanTags() {
  const { control, setValue } = useEditPlanFormContext();
  const formTags = useWatch({ control, name: "tags" });
  const {
    errors: {
      tags: tagsError
    }
  } = useFormState({ control, name: "tags" });

  const [tag, setTag] = useState("");
  const [touched, setTouched] = useState(false);

  const tagListValidation = TagsSchema.safeParse([...formTags, tag]); // include current tag input
  const errors = tagListValidation.error ? tagListValidation.error.issues : [];

  const setTagInput = useCallback((tag: string) => {
    setTag(tag);
    setTouched(!!tag);
  }, [setTag, setTouched]);
  
  return (
    <section className="grid gap-1.5">
      <h1 className="text-2xl font-bold">Tags</h1>
      <div className="flex flex-col @min-3xl:flex-row flex-wrap justify-between items-start @min-3xl:items-end gap-1.5">
        <p className="font-semibold text-muted-foreground text-sm">
          Add extra tags to your plan here. (optional)
        </p>
        <span className={cn("shrink-0 text-sm", formTags.length > 10 && "text-red-500")}>
          <b className="text-base">{formTags.length}</b> / 10
        </span>
      </div>
      <div className="error-text text-sm has-[>span:empty]:hidden">
        <Info size={16}/>
        <span>{tagsError?.message}</span>
      </div>
      <div className="flex justify-between items-stretch gap-3">
        <Input 
          value={tag}
          placeholder="Tag"
          onChange={(e) => setTagInput(e.target.value)}
          className="rounded-sm shadow-none"
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
          className="h-full mealicious-button font-semibold text-sm px-6 py-1.5 rounded-sm"
        >
          Add
        </button>
      </div>
      <div className="error-label flex flex-col gap-2 has-[>ul:empty]:hidden mt-1">
        <div className="flex items-center gap-2">
          <Info size={14}/>
          <span className="font-bold text-xs">Errors</span>
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
      <div className="grid gap-1.5 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          You can remove a tag by clicking on it.
        </div>
        <ul className="flex flex-wrap gap-2">
          {
            formTags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  key={t}
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
    </section>
  );
}
