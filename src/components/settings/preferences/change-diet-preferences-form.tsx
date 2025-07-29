"use client";

import { ChangeDietPreferencesFormSchema, MAX_DIET_SCORE, type ChangeDietPreferencesForm } from "@/lib/zod/settings";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { Control, useFieldArray, useForm, UseFormSetValue, useFormState, useWatch } from "react-hook-form";
import { memo, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Info, LoaderCircle, Minus, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { updateDietPreferences } from "@/lib/actions/settings";
import { toast } from "sonner";

type ChangeDietPreferencesFormProps = {
  dietPreferences: {
    id: string;
    name: string;
    description: string;
    score: number;
  }[];
};

const MAX_DIET_DISPLAY_LIMIT = 6;

export default function ChangeDietPreferencesForm({ dietPreferences }: ChangeDietPreferencesFormProps) {
  const [open, setOpen] = useState(false);
  const {
    control,
    setValue,
    handleSubmit,
    reset,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm<ChangeDietPreferencesForm>({
    resolver: zodResolver(ChangeDietPreferencesFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { preferences: dietPreferences }
  });
  const { fields } = useFieldArray({ control, name: "preferences" });

  const { executeAsync } = useAction(updateDietPreferences, {
    onSuccess: ({ data, input }) => {
      if (!data) return;
      toast.success(data.message);
      reset(input);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const previewDiets = useMemo(
    () => fields.slice(0, MAX_DIET_DISPLAY_LIMIT),
    [fields]
  );

  const restOfDiets = useMemo(
    () => fields.slice(MAX_DIET_DISPLAY_LIMIT),
    [fields]
  );

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });
  
  return (
    <form onSubmit={onSubmit} className="grid overflow-hidden">
      <h1 className="font-bold text-xl">Diet Preferences</h1>
      <p className="text-muted-foreground mb-1">Change your diet preferences here.</p>
      <div className="text-muted-foreground flex items-center gap-2">
        <Info size={16}/>
        <p className="text-muted-foreground font-light text-sm">These preferences can be applied when you search for new recipes.</p>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="grid border border-border mt-4 rounded-md">
        <div className="grid">
          {
            previewDiets.map((d, index) => (
              <DietPreference 
                key={d.id}
                index={index}
                control={control}
                setPreferenceValue={setValue}
              />
            ))
          }
        </div>
        <CollapsibleContent className="grid">
          {
            restOfDiets.map((d, index) => (
              <DietPreference 
                key={d.id}
                index={index + MAX_DIET_DISPLAY_LIMIT}
                control={control}
                setPreferenceValue={setValue}
              />
            ))
          }
        </CollapsibleContent>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center py-6! px-3! rounded-none">
            {open ? "Less Diets" : "More Diets"}
            {open ? <Minus /> : <Plus />}
          </Button>
        </CollapsibleTrigger>
        <div className={cn(
          "border-t border-t-border flex items-center gap-3 p-3",
          !isDirty && "hidden"
        )}>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => reset()}
            className="cursor-pointer rounded-sm"
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mealicious-button w-20 flex justify-center items-center text-white text-sm font-semibold py-2 px-4 rounded-sm"
          >
            {isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : "Submit"}
          </button>
        </div>
      </Collapsible>
    </form>
  );
}

type DietPreferenceProps<T extends ChangeDietPreferencesForm = ChangeDietPreferencesForm> = {
  index: number;
  control: Control<T>;
  setPreferenceValue: UseFormSetValue<T>;
};

const DietPreference = memo(({ index, control, setPreferenceValue }: DietPreferenceProps) => {
  const dietPreference = useWatch({ control, name: `preferences.${index}` });
  const { 
    errors: { preferences: preferencesError }
  } = useFormState({ control, name: `preferences.${index}` });

  return (
    <div className="grid border-b border-b-border gap-2.5 p-4">
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="cursor-pointer"/>
          </PopoverTrigger>
          <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
            {dietPreference.description}
          </PopoverContent>
        </Popover>
        <h2 className="font-semibold text-sm">{dietPreference.name}</h2>
      </div>
      {
        preferencesError?.[index]?.score?.message && (
          <div className="flex items-center gap-1.5 text-red-500 text-xs">
            {preferencesError[index].score.message}
          </div>
        )
      }
      <RadioGroup 
        value={String(dietPreference.score)}
        onValueChange={(val) => setPreferenceValue(`preferences.${index}.score`, Number(val), { shouldDirty: true })}
        className="flex justify-between gap-2.5"
      >
        {
          Array.from({ length: MAX_DIET_SCORE + 1 }, (_, i) => String(i)).map((i) => (
            <div key={i} className="flex-1 border border-border has-[[data-state=checked]]:border-mealicious-primary has-[[data-state=checked]]:bg-mealicious-primary/20 flex flex-col sm:flex-row justify-around items-center gap-2 rounded-sm py-2 px-3">
              <RadioGroupItem value={i} id={`${dietPreference.name}-score-${i}`} />
              <Label htmlFor={`${dietPreference.name}-score-${i}`} className="text-muted-foreground/50 [[data-state=checked]~&]:text-primary">
                {i}
              </Label>
            </div>
          ))
        }
      </RadioGroup>
    </div>
  );
});

DietPreference.displayName = "DietPreference";
