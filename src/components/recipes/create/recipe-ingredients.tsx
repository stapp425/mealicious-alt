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
import { MAX_RECIPE_INGREDIENT_AMOUNT, MAX_RECIPE_INGREDIENT_NAME_LENGTH, MAX_RECIPE_INGREDIENTS_LENGTH } from "@/lib/zod/recipe";
import { UnitSchema } from "@/lib/zod";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useFormState } from "react-hook-form";
import z from "zod/v4";
import { useCreateRecipeFormContext } from "@/components/recipes/create/create-recipe-form";

type Ingredient = z.infer<typeof IngredientInputSchema>;

const IngredientInputSchema = z.object({
  name: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "An ingredient name is required."
      : "Expected a string, but received an invalid type."
  }).nonempty({
    abort: true,
    error: "Name cannot be empty."
  }).max(MAX_RECIPE_INGREDIENT_NAME_LENGTH, {
    error: `Name cannot have more than ${MAX_RECIPE_INGREDIENT_NAME_LENGTH.toLocaleString()} characters.`
  }),
  amount: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "An ingredient amount is required."
      : "Expected a number, but received an invalid type."
  }).positive({
    abort: true,
    error: "Amount must be positive."
  }).max(MAX_RECIPE_INGREDIENT_AMOUNT, {
    error: `Amount must be at most ${MAX_RECIPE_INGREDIENT_AMOUNT.toLocaleString()}.`
  }),
  unit: UnitSchema,
  isAllergen: z.boolean("Expected a boolean, but received an invalid type."),
  note: z.optional(z.string("Expected a string, but received an invalid type."))
});

export default function RecipeIngredients() {
  const { control } = useCreateRecipeFormContext();
  const { append, remove, update, fields: formIngredientValues } = useFieldArray({ control, name: "ingredients" });
  const { 
    errors: {
      ingredients: ingredientsError
    }
  } = useFormState({ control, name: "ingredients" });
  const [touched, setTouched] = useState<boolean>(false);
  const [ingredient, setIngredient] = useState<Ingredient>({
    name: "",
    amount: 0,
    unit: "g",
    isAllergen: false,
    note: ""
  });

  const deleteIngredient = useCallback((index: number) => remove(index), []);
  const setIngredientContent = useCallback((index: number, ingredient: Ingredient) => update(index, ingredient), []);

  const parsedIngredient = IngredientInputSchema.safeParse(ingredient);
  const error = parsedIngredient.error?.message;
  
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold required-field">Ingredients</h1>
      <div className="flex flex-col sm:flex-row justify-between items-start md:items-end gap-2">
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
            max={MAX_RECIPE_INGREDIENT_AMOUNT}
            step="any"
            value={ingredient.amount}
            placeholder="Amount"
            onChange={(e) => {
              if (!touched) setTouched(true);
              setIngredient((i) => ({ 
                ...i,
                amount: Number(e.target.value)
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
            if (!touched) setTouched(true);
            setIngredient((i) => ({
              ...i,
              name: e.target.value
            }));
          }}
        />
      </div>
      <Input 
        value={ingredient.note}
        placeholder="Note (optional)"
        onChange={(e) => {
          if (!touched) setTouched(true);
          
          setIngredient((i) => ({
            ...i,
            note: e.target.value
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
        disabled={!!error || formIngredientValues.length >= MAX_RECIPE_INGREDIENT_AMOUNT}
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
          <div className="flex items-center gap-2 text-sm">
            <Info size={16}/>
            <span className={cn(formIngredientValues.length > MAX_RECIPE_INGREDIENTS_LENGTH && "text-red-500")}>
              Ingredient count: <b>{formIngredientValues.length}</b> / {MAX_RECIPE_INGREDIENTS_LENGTH}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {
              formIngredientValues.map((i, index) => (
                <RecipeIngredient 
                  key={i.id}
                  currentIngredientContent={i}
                  currentIngredientIndex={index}
                  deleteIngredient={deleteIngredient}
                  setIngredientContent={setIngredientContent}
                />
              ))
            }
          </div>
          </>
        )
      }
      { 
        ingredientsError?.message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {ingredientsError.message}
          </div>
        )
      }
    </div>
  );
}

type RecipeIngredientProps = {
  currentIngredientIndex: number;
  currentIngredientContent: Ingredient;
  setIngredientContent: (index: number, ingredient: Ingredient) => void;
  deleteIngredient: (index: number) => void;
};

const RecipeIngredient = memo(({ 
  currentIngredientIndex,
  currentIngredientContent,
  setIngredientContent,
  deleteIngredient
}: RecipeIngredientProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [ingredientInput, setIngredientInput] = useState<Ingredient>(currentIngredientContent);

  const error = useMemo(
    () => IngredientInputSchema.safeParse(ingredientInput).error?.message || (
      ingredientInput.name === currentIngredientContent.name &&
      ingredientInput.amount === currentIngredientContent.amount &&
      ingredientInput.unit === currentIngredientContent.unit &&
      ingredientInput.isAllergen === currentIngredientContent.isAllergen && 
      ingredientInput.note === currentIngredientContent.note 
    ) && "Content cannot be similar." as string || undefined,
    [ingredientInput, currentIngredientContent]
  );

  useEffect(() => {
    if (!editMode) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const element = containerRef.current;
      const targetElement = e.target instanceof Element ? e.target.closest(".ingredient-content") : null;
      if (element && targetElement && targetElement !== element) {
        setEditMode(false);
        setIngredientInput(currentIngredientContent);
      }
    };

    document.addEventListener("pointerup", handleOutsideClick);
    return () => document.removeEventListener("pointerup", handleOutsideClick);
  }, [editMode, currentIngredientContent]);
  
  return (
    <div ref={containerRef} className="ingredient-content text-left overflow-hidden items-center border border-border rounded-md transition-colors">
      {
        editMode ? (
          <>
          <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center gap-2">
              <Input 
                type="number"
                value={ingredientInput.amount}
                onChange={(e) => setIngredientInput((i) => ({
                  ...i,
                  amount: Number(e.target.value)
                }))}
                placeholder="0"
                className="w-24"
              />
              <Select 
                value={ingredientInput.unit}
                onValueChange={(val) => setIngredientInput((i) => ({
                  ...i,
                  unit: val as Unit["abbreviation"]
                }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Unit" />
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
              value={ingredientInput.name}
              onChange={(e) => setIngredientInput((i) => ({
                ...i,
                name: e.target.value
              }))}
              placeholder="Ingredient Name"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id={`ingredient-${currentIngredientIndex}-isAllergen`}
                checked={ingredientInput.isAllergen}
                onCheckedChange={(val) => setIngredientInput((i) => ({
                  ...i,
                  isAllergen: val === true
                }))}
              />
              <label
                htmlFor={`ingredient-${currentIngredientIndex}-isAllergen`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Is Allergen
              </label>
            </div>
            <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-6">
              {
                error && (
                  <div className="error-text text-xs mr-auto">
                    <Info size={14}/>
                    {error}
                  </div> 
                )
              }
              <div className="w-full sm:w-auto flex items-center gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setIngredientInput(currentIngredientContent);
                  }}
                  className="cursor-pointer underline text-xs font-semibold rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!!error}
                  onClick={() => {
                    setIngredientContent(currentIngredientIndex, ingredientInput);
                    setEditMode(false);
                  }}
                  className="mealicious-button text-xs font-semibold py-2 px-6 rounded-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
          <Separator />
          <div className="p-3">
            <Input 
              value={ingredientInput.note}
              onChange={(e) => setIngredientInput((i) => ({
                ...i,
                note: e.target.value
              }))}
              placeholder="Ingredient Note"
            />
          </div>
          </>
        ) : (
          <>
          <div className="flex flex-col gap-3 p-3">
            <div className="flex justify-end items-center gap-2">
              <h1 className="font-bold text-xl mr-auto">{currentIngredientContent.amount} {currentIngredientContent.unit}</h1>
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="size-8 group cursor-pointer border border-muted-foreground hover:bg-mealicious-primary hover:border-mealicious-primary hover:text-white font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 rounded-full transition-colors"
              >
                <Pencil size={16} className="shrink-0 stroke-muted-foreground group-hover:stroke-white"/>
              </button>
              <button
                type="button"
                onClick={() => deleteIngredient(currentIngredientIndex)}
                className="size-8 group cursor-pointer hover:bg-red-700 hover:text-white hover:border-red-700 border border-muted-foreground font-semibold text-xs text-nowrap flex justify-center items-center gap-1.5 py-2 px-3 rounded-full transition-colors"
              >
                <Trash2 size={16} className="shrink-0 stroke-muted-foreground group-hover:stroke-white"/>
              </button>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="w-full line-clamp-1 text-xl font-semibold text-muted-foreground">
                {currentIngredientContent.name}
              </span>
              {currentIngredientContent.isAllergen && <span className="font-semibold text-muted-foreground">(Allergen)</span>}
            </div>
          </div>
          {
            currentIngredientContent.note && (
              <>
              <Separator />
              <div className="p-3 break-all">
                {currentIngredientContent.note}
              </div>
              </>
            )
          }
          </>
        )
      }
    </div>
  );
});

RecipeIngredient.displayName = "RecipeIngredient";
