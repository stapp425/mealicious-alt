"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Unit, unitAbbreviations } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MAX_INGREDIENT_AMOUNT, MAX_INGREDIENT_NAME_LENGTH, MAX_INGREDIENTS_LENGTH, RecipeCreation, UnitSchema } from "@/lib/zod";
import { Info, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import z from "zod";

type Ingredient = {
  name: string;
  amount: number;
  unit: Unit["abbreviation"];
  isAllergen: boolean;
  note?: string;
};

const IngredientInputSchema = z.object({
  name: z.string().nonempty({
    message: "Name cannot be empty."
  }).max(MAX_INGREDIENT_NAME_LENGTH, {
    message: `Name cannot have more than ${MAX_INGREDIENT_NAME_LENGTH.toLocaleString()} characters.`
  }),
  amount: z.number().positive({
    message: "Amount must be positive."
  }).max(MAX_INGREDIENT_AMOUNT, {
    message: `Amount must be at most ${MAX_INGREDIENT_AMOUNT.toLocaleString()}.`
  }),
  unit: UnitSchema,
  isAllergen: z.boolean(),
  note: z.optional(z.string())
});

export default function RecipeIngredients() {
  const {
    control,
    formState: {
      errors
    }
  } = useFormContext<RecipeCreation>();
  const { append, remove } = useFieldArray({ control, name: "ingredients" });
  const formIngredientValues = useWatch({ control, name: "ingredients" });
  const [touched, setTouched] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [ingredient, setIngredient] = useState<Ingredient>({
    name: "",
    amount: 0,
    unit: "g",
    isAllergen: false,
    note: ""
  });

  const formIngredientValuesSet = useMemo(
    () => new Set(formIngredientValues.map((fi) => fi.name)),
    [formIngredientValues]
  );
  
  const validateInput = useDebouncedCallback(() => {
    const parsedIngredientInput = IngredientInputSchema.refine(({ name }) => !formIngredientValuesSet.has(name), {
      message: "Ingredient name must be unique."
    }).safeParse(ingredient);
    
    if (parsedIngredientInput.success)
      setError(undefined);
    else
      setError(parsedIngredientInput.error.errors[0]?.message);
  }, 250);

  useEffect(() => {
    validateInput();
  }, [ingredient]);
  
  return (
    <div className="field-container flex flex-col gap-3">
      <h1 className="text-2xl font-bold required-field">Ingredients</h1>
      <div className="flex justify-between items-end">
        <p className="font-semibold text-muted-foreground">Add ingredients to your recipe here.</p>
        {
          (touched && error) && (
            <div className="error-text">
              <Info size={14}/>
              {error}
            </div>
          )
        }
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex sm:justify-between gap-3">
          <Input
            type="number"
            min={0}
            max={MAX_INGREDIENT_AMOUNT}
            step="any"
            value={ingredient.amount}
            placeholder="Amount"
            onChange={(e) => {
              const { value } = e.target;
              if (!touched) setTouched(true);
              setIngredient((i) => ({ 
                ...i,
                amount: Number(value)
              }));
            }}
            className="w-[100px]"
          />
          <Select value={ingredient.unit} onValueChange={(val) => {
            if (!touched) setTouched(true);
            setIngredient((i) => ({ ...i, unit: val as Unit["abbreviation"] }));
          }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="unit"/>
            </SelectTrigger>
            <SelectContent>
              {
                unitAbbreviations.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <Input
          type="text"
          value={ingredient.name}
          placeholder="Name"
          autoCorrect="off"
          onChange={(e) => {
            const { value } = e.target;
            if (!touched) setTouched(true);
            setIngredient((i) => ({
              ...i,
              name: value
            }));
          }}
        />
      </div>
      <Input 
        value={ingredient.note}
        placeholder="Note (optional)"
        onChange={(e) => {
          const { value } = e.target;
          if (!touched) setTouched(true);
          
          setIngredient((i) => ({
            ...i,
            note: value
          }));
        }}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="isAllergen"
          checked={ingredient.isAllergen}
          onCheckedChange={(val) => setIngredient((i) => ({
            ...i,
            isAllergen: val === true
          }))}
        />
        <label
          htmlFor="isAllergen"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Is Allergen
        </label>
      </div>
      <button
        type="button"
        disabled={!!error || formIngredientValues.length >= MAX_INGREDIENT_AMOUNT}
        onClick={() => {
          append(ingredient);
          setIngredient({
            name: "",
            amount: 0,
            unit: "g",
            isAllergen: false,
            note: ""
          });
          setTouched(false);
        }}
        className="mealicious-button font-semibold flex justify-center items-center gap-3 py-2 rounded-md"
      >
        Add Ingredient
        <Plus size={18}/>
      </button>
      {
        formIngredientValues.length > 0 && (
          <>
          <Separator />
          <div className="flex flex-col justify-between md:flex-row items-start md:items-end">
            <div className="flex items-center gap-2 text-sm">
              <Info size={16}/>
              You can remove an ingredient by clicking on it.
            </div>
            <span className={cn(formIngredientValues.length > MAX_INGREDIENTS_LENGTH && "text-red-500")}>
              <b className="text-xl">{formIngredientValues.length}</b> / {MAX_INGREDIENTS_LENGTH}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {
              formIngredientValues.map((i, index) => (
                <button
                  type="button"
                  key={i.name}
                  onClick={() => remove(index)}
                  className="cursor-pointer text-left overflow-hidden group items-center border border-border rounded-md hover:border-red-500 dark:hover:border-red-500 hover:bg-red-500 transition-colors shadow-sm"
                >
                  <div className="flex flex-col gap-0.5 p-3">
                    <div className="flex justify-between items-center group-hover:text-white">
                      <h1 className="font-bold text-xl">{i.amount} {i.unit}</h1>
                      {i.isAllergen && <span className="font-semibold text-muted-foreground">(Allergen)</span>}
                    </div>
                    <span className="w-full line-clamp-1 text-xl font-semibold text-muted-foreground group-hover:text-white">
                      {i.name}
                    </span>
                  </div>
                  {
                    i.note && (
                      <>
                      <Separator />
                      <div className="p-3 break-all">
                        {i.note}
                      </div>
                      </>
                    )
                  }
                </button>
              ))
            }
          </div>
          </>
        )
      }
      { 
        errors.ingredients?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {errors.ingredients.message}
          </div>
        )
      }
    </div>
  );
}