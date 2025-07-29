"use client";

import { cn } from "@/lib/utils";
import { ChangeCuisinePreferencesFormSchema, MAX_CUISINE_SCORE, type ChangeCuisinePreferencesForm } from "@/lib/zod/settings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { createContext, memo, useContext } from "react";
import { Control, useFieldArray, UseFieldArrayAppend, UseFieldArrayRemove, useForm, UseFormSetValue, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import CuisineSearch from "@/components/settings/preferences/cuisine-search";
import { Label } from "@/components/ui/label";
import { updateCuisinePreferences } from "@/lib/actions/settings";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

type ChangeCuisinePreferencesFormProps = {
  cuisinePreferences: {
    id: string;
    icon: string;
    adjective: string;
    description: string;
  }[];
};

type ChangeCuisinePreferencesFormContextProps<T extends ChangeCuisinePreferencesForm = ChangeCuisinePreferencesForm> = {
  control: Control<T>;
  append: UseFieldArrayAppend<T>;
  remove: UseFieldArrayRemove;
};

const ChangeCuisinePreferencesFormContext = createContext<ChangeCuisinePreferencesFormContextProps | null>(null);

export function useChangeCuisinePreferencesFormContext() {
  const context = useContext(ChangeCuisinePreferencesFormContext);
  if (!context) throw new Error("useChangeCuisinePreferencesFormContext can only be used within a ChangeCuisinePreferencesFormContext.");
  return context;
}

export default function ChangeCuisinePreferencesForm({ cuisinePreferences }: ChangeCuisinePreferencesFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm<ChangeCuisinePreferencesForm>({
    resolver: zodResolver(ChangeCuisinePreferencesFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { preferences: cuisinePreferences }
  });
  const { fields, append, remove } = useFieldArray({ control, name: "preferences" });

  const { executeAsync } = useAction(updateCuisinePreferences, {
    onSuccess: ({ data, input }) => {
      if (!data) return;
      toast.success(data.message);
      reset(input);
    },
    onError: ({ error: { serverError } }) => toast.error(serverError)
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });
  
  return (
    <ChangeCuisinePreferencesFormContext value={{ control, append, remove }}>
      <form onSubmit={onSubmit} className="grid overflow-hidden">
        <h1 className="font-bold text-xl">Cuisine Preferences</h1>
        <p className="text-muted-foreground mb-1">Change your cuisine preferences here.</p>
        <div className="text-muted-foreground flex items-center gap-2">
          <Info size={16}/>
          <p className="text-muted-foreground font-light text-sm">These preferences can be applied when you search for new recipes.</p>
        </div>
        <div className="border border-border mt-4 rounded-md overflow-hidden">
          <div className="peer/cuisines grid empty:hidden">
            {
              fields.map((f, index) => (
                <CuisinePreference 
                  key={f.id}
                  index={index}
                  setPreferenceValue={setValue}
                />
              ))
            }
          </div>
          <div className="min-h-36 font-bold text-muted-foreground text-lg text-center hidden peer-empty/cuisines:flex flex-col justify-center items-center">
            No cuisine preferences found.
          </div>
          <div className="border-t border-t-border flex items-center gap-3 p-3">
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => reset()}
              className={cn("cursor-pointer rounded-sm", !isDirty && "hidden")}
            >
              Cancel
            </Button>
            <CuisineSearch />
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn("mealicious-button w-20 flex justify-center items-center text-white text-sm font-semibold py-2 px-4 rounded-sm", !isDirty && "hidden")}
            >
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </ChangeCuisinePreferencesFormContext>
  );
}

type CuisinePreferenceProps<T extends ChangeCuisinePreferencesForm = ChangeCuisinePreferencesForm> = {
  index: number;
  setPreferenceValue: UseFormSetValue<T>;
};

const CuisinePreference = memo(({ index, setPreferenceValue }: CuisinePreferenceProps) => {
  const { control, remove } = useChangeCuisinePreferencesFormContext();
  const cuisinePreference = useWatch({ control, name: `preferences.${index}` });
  return (
    <div className="grid gap-4 not-first:border-t not-first:border-t-border p-4">
      <div className="flex items-center gap-3">
        <Image 
          src={cuisinePreference.icon}
          alt={`Origin of ${cuisinePreference} cuisine`}
          width={32}
          height={32}
          className="object-cover object-center rounded-full"
        />
        <h2 className="font-semibold text-lg">{cuisinePreference.adjective}</h2>
        <Button
          type="button"
          variant="destructive"
          onClick={() => remove(index)}
          className="cursor-pointer size-8 ml-auto rounded-sm"
        >
          <Trash2 />
        </Button>
      </div>
      <RadioGroup 
        value={String(cuisinePreference.score)}
        onValueChange={(val) => setPreferenceValue(`preferences.${index}.score`, Number(val), { shouldDirty: true })}
        className="flex justify-between gap-2 sm:gap-3"
      >
        {
          Array.from({ length: MAX_CUISINE_SCORE }, (_, i) => String(i + 1)).map((i) => (
            <div key={i} className="flex-1 border border-border has-[[data-state=checked]]:border-mealicious-primary has-[[data-state=checked]]:bg-mealicious-primary/20 flex flex-col sm:flex-row justify-around items-center gap-2 rounded-sm py-2 px-3">
              <RadioGroupItem value={i} id={`${cuisinePreference.adjective}-score-${i}`} />
              <Label htmlFor={`${cuisinePreference.adjective}-score-${i}`} className="text-muted-foreground/50 [[data-state=checked]~&]:text-primary">
                {i}
              </Label>
            </div>
          ))
        }
      </RadioGroup>
    </div>
  );
});

CuisinePreference.displayName = "CuisinePreference";
