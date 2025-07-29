"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Unit } from "@/lib/types";
import { type ChangeNutritionPreferencesForm, ChangeNutritionPreferencesFormSchema, MAX_NUTRITION_AMOUNT_LIMIT } from "@/lib/zod/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { memo, useMemo, useState } from "react";
import { Control, useFieldArray, useForm, UseFormRegister, UseFormSetValue, useFormState, useWatch } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Info, LoaderCircle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAction } from "next-safe-action/hooks";
import { updateNutritionPreferences } from "@/lib/actions/settings";
import { toast } from "sonner";

type ChangeNutritionPreferencesFormProps = {
  nutritionPreferences: {
    id: string;
    name: string;
    description: string;
    unit: Unit["abbreviation"];
    allowedUnits: Unit["abbreviation"][];
    amountLimit: number;
  }[]
};

const MAX_NUTRITION_DISPLAY_LIMIT = 4;

export default function ChangeNutritionPreferencesForm({ nutritionPreferences }: ChangeNutritionPreferencesFormProps) {
  const [open, setOpen] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm<ChangeNutritionPreferencesForm>({
    resolver: zodResolver(ChangeNutritionPreferencesFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      preferences: nutritionPreferences
    }
  });
  const { fields } = useFieldArray({ control, name: "preferences" });

  const { executeAsync } = useAction(updateNutritionPreferences, {
    onSuccess: ({ data, input }) => {
      if (!data) return;
      toast.success(data.message);
      reset(input);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const macronutrients = useMemo(
    () => fields.slice(0, MAX_NUTRITION_DISPLAY_LIMIT),
    [fields]
  );

  const micronutrients = useMemo(
    () => fields.slice(MAX_NUTRITION_DISPLAY_LIMIT),
    [fields]
  );

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });
  
  return (
    <form onSubmit={onSubmit} className="grid overflow-hidden">
      <h1 className="font-bold text-xl">Nutrition Preferences</h1>
      <p className="text-muted-foreground mb-1">Change your nutrition preferences here.</p>
      <div className="text-muted-foreground flex items-center gap-2">
        <Info size={16}/>
        <p className="text-muted-foreground font-light text-sm">Note that these are for tracking your preferred daily requirements.</p>
      </div>
      <Collapsible open={open} onOpenChange={setOpen} className="grid border border-border mt-4 rounded-md">
        <div className="grid">
          {
            macronutrients.map((p, index) => (
              <NutritionPreference 
                key={p.id}
                index={index}
                register={register}
                control={control}
                setPreferenceValue={setValue}
              />
            ))
          }
        </div>
        <CollapsibleContent className="grid">
          {
            micronutrients.map((p, index) => (
              <NutritionPreference 
                key={p.id}
                index={index + MAX_NUTRITION_DISPLAY_LIMIT}
                register={register}
                control={control}
                setPreferenceValue={setValue}
              />
            ))
          }
        </CollapsibleContent>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center py-6! px-3! rounded-none">
            {open ? "Less Nutrition" : "More Nutrition"}
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

type NutritionPreferenceProps<T extends ChangeNutritionPreferencesForm = ChangeNutritionPreferencesForm> = {
  index: number;
  control: Control<T>;
  register: UseFormRegister<T>;
  setPreferenceValue: UseFormSetValue<T>;
};

const NutritionPreference = memo(({ index, control, register, setPreferenceValue }: NutritionPreferenceProps) => {
  const nutritionPreference = useWatch({ control, name: `preferences.${index}` });
  const {
    errors: {
      preferences: preferencesError
    }
  } = useFormState({ control, name: `preferences.${index}` });

  return (
    <div className="grid border-b border-b-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center">
        <div className="w-full flex-1 grid gap-3 p-3">
          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Info size={16} className="cursor-pointer"/>
              </PopoverTrigger>
              <PopoverContent className="text-xs font-semibold text-muted-foreground p-3 text-wrap hyphens-auto" align="start">
                {nutritionPreference.description}
              </PopoverContent>
            </Popover>
            <h2 className="font-semibold text-sm">{nutritionPreference.name}</h2>
          </div>
          {
            preferencesError?.[index]?.message && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                {preferencesError[index].message}
              </div>
            )
          }
          <Slider 
            value={[nutritionPreference.amountLimit]}
            onValueChange={(val) => setPreferenceValue(`preferences.${index}.amountLimit`, val[0], { shouldDirty: true })}
            min={0}
            max={MAX_NUTRITION_AMOUNT_LIMIT}
            step={10}
            className="flex-1"
          />
        </div>
        <Separator orientation="vertical" className="hidden sm:block"/>
        <div className="flex items-center gap-2 p-3.5">
          <Input 
            type="number"
            {...register(
              `preferences.${index}.amountLimit`,
              { setValueAs: (val) => val === "" ? 0 : Number(val) }
            )}
            min={0}
            max={MAX_NUTRITION_AMOUNT_LIMIT}
            step={1}
            placeholder="Limit"
            className="font-semibold w-[100px] shadow-none rounded-sm placeholder:font-normal"
          />
          <Select value={nutritionPreference.unit} onValueChange={(val) => setPreferenceValue(`preferences.${index}.unit`, val as Unit["abbreviation"], { shouldDirty: true })}>
            <SelectTrigger className="w-[100px]" disabled={nutritionPreference.allowedUnits.length <= 1}>
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              {
                nutritionPreference.allowedUnits.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
});

NutritionPreference.displayName = "NutritionPreference";
