"use client";

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
import {
  EditRecipeFormSchema,
  MAX_RECIPE_INGREDIENT_AMOUNT,
  MAX_RECIPE_INGREDIENTS_LENGTH
} from "@/lib/zod/recipe";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { ComponentProps, memo, useCallback, useEffect, useRef, useState } from "react";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";
import { useFieldArray, useFormState } from "react-hook-form";
import z from "zod/v4";

const IngredientInputSchema = EditRecipeFormSchema.shape.ingredients.element;
type Ingredient = z.infer<typeof IngredientInputSchema>;

export default function RecipeIngredients({ className, ...props }: Omit<ComponentProps<"section">, "children">) {
  const { control } = useEditRecipeFormContext();
  const { append, remove, update, fields: formIngredientValues } = useFieldArray({ control, name: "ingredients" });
  const { 
    isSubmitSuccessful,
    errors: {
      ingredients: ingredientsError
    }
  } = useFormState({ control, name: "ingredients" });
  const [touched, setTouched] = useState<boolean>(false);
  const errorFocusInput = useRef<HTMLInputElement>(null);

  const [ingredient, setIngredient] = useState<Ingredient>({
    name: "",
    amount: 0,
    unit: "g",
    note: undefined
  });

  const deleteIngredient = useCallback(
    (index: number) => remove(index),
    [remove]
  );

  const setIngredientContent = useCallback(
    (index: number, ingredient: Ingredient) => update(index, { ...ingredient, note: ingredient.note || undefined }),
    [update]
  );

  const resetIngredientInput = useCallback(() => {
    setIngredient({
      name: "",
      amount: 0,
      unit: "g",
      note: undefined
    });
    setTouched(false);
  }, [setIngredient, setTouched]);

  const { error: ingredientInputError } = IngredientInputSchema.safeParse(ingredient);

  useEffect(() => {
    if (ingredientsError && !isSubmitSuccessful && document.activeElement?.tagName === "BODY")
      errorFocusInput.current?.focus();
  }, [ingredientsError, isSubmitSuccessful]);
  
  return (
    <section 
      {...props}
      className={cn(
        "@container flex flex-col gap-2",
        className
      )}
    >
      <h1 className="text-2xl font-bold required-field">Ingredients</h1>
      <p className="font-semibold text-muted-foreground text-sm">Add ingredients to your recipe here.</p>
      <div className="error-text text-xs has-[>span:empty]:hidden">
        <Info size={14}/>
        <span>{ingredientsError?.message}</span>
      </div>
      <div className="flex flex-col @min-2xl:flex-row justify-between gap-2">
        <div className="flex @min-2xl:justify-between gap-2">
          <Input
            ref={errorFocusInput}
            type="number"
            value={ingredient.amount}
            min={0}
            max={MAX_RECIPE_INGREDIENT_AMOUNT}
            step="any"
            placeholder="Amount"
            onChange={(e) => {
              setTouched(true);
              setIngredient((i) => ({ 
                ...i,
                amount: Number(e.target.value)
              }));
            }}
            className="w-24 rounded-sm shadow-none"
          />
          <Select value={ingredient.unit} onValueChange={(val) => {
            setTouched(true);
            setIngredient((i) => ({ ...i, unit: val as Unit["abbreviation"] }));
          }}>
            <SelectTrigger className="w-24 shadow-none rounded-sm">
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
            setTouched(true);
            setIngredient((i) => ({
              ...i,
              name: e.target.value
            }));
          }}
          className="shadow-none rounded-sm"
        />
      </div>
      <Input 
        value={ingredient.note || ""}
        placeholder="Note (optional)"
        onChange={(e) => {
          setTouched(true);
          setIngredient((i) => ({
            ...i,
            note: e.target.value || undefined
          }));
        }}
        className="rounded-sm shadow-none"
      />
      <div className="error-label flex flex-col gap-2 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2">
          <Info size={14}/>
          <span className="font-bold text-sm">Input Errors</span>
        </div>
        <Separator className="bg-primary/33 dark:bg-border"/>
        <ul className="flex flex-col gap-1">
          {
            touched && ingredientInputError?.issues.map((i) => (
              <li key={i.message} className="text-xs list-inside list-disc">
                {i.message}
              </li>
            ))
          }
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!!ingredientInputError || formIngredientValues.length >= MAX_RECIPE_INGREDIENT_AMOUNT}
          onClick={() => {
            append({ ...ingredient, note: ingredient.note || undefined });
            resetIngredientInput();
          }}
          className="mealicious-button font-semibold text-sm flex justify-center items-center gap-2 py-2 px-6 rounded-sm"
        >
          Add Ingredient
          <Plus size={18}/>
        </button>
        <button
          type="button"
          onClick={resetIngredientInput}
          className={cn(
            "cursor-pointer font-semibold text-white text-nowrap text-sm py-2 px-6 rounded-sm transition-colors",
            "bg-red-500 hover:bg-red-700",
            !touched && "hidden"
          )}
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-col gap-1.5 has-[>ul:empty]:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Info size={16}/>
          <span className={cn(formIngredientValues.length > MAX_RECIPE_INGREDIENTS_LENGTH && "text-red-500")}>
            Ingredient count: <b>{formIngredientValues.length}</b> / {MAX_RECIPE_INGREDIENTS_LENGTH}
          </span>
        </div>
        <ul className="grid @min-2xl:grid-cols-2 gap-3 items-start">
          {
            formIngredientValues.map((i, index) => (
              <RecipeIngredient 
                key={i.id}
                currentIngredientContent={i}
                currentIngredientIndex={index}
                deleteIngredient={deleteIngredient}
                setIngredientContent={setIngredientContent}
                className="@min-2xl:odd:last:col-span-2"
              />
            ))
          }
        </ul>
      </div>
    </section>
  );
}

const RecipeIngredient = memo(({ 
  currentIngredientIndex,
  currentIngredientContent,
  setIngredientContent,
  deleteIngredient,
  className,
  ...props
}: Omit<ComponentProps<"li">, "children"> & {
  currentIngredientIndex: number;
  currentIngredientContent: Ingredient;
  setIngredientContent: (index: number, ingredient: Ingredient) => void;
  deleteIngredient: (index: number) => void;
}) => {
  const containerRef = useRef<HTMLLIElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [touched, setTouched] = useState(false);
  const [ingredientInput, setIngredientInput] = useState<Ingredient>({ ...currentIngredientContent, note: currentIngredientContent.note || "" });
  
  const { error: ingredientInputError } = IngredientInputSchema.safeParse(ingredientInput);

  const resetIngredientInput = useCallback(() => {
    setEditMode(false);
    setTouched(false);
    setIngredientInput({ ...currentIngredientContent, note: currentIngredientContent.note || "" });
  }, [setEditMode, setTouched, setIngredientInput, currentIngredientContent]);

  useEffect(() => {
    if (!editMode) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const element = containerRef.current;
      const targetElement = e.target instanceof Element ? e.target.closest(".ingredient-content") : null;
      if (element && targetElement && targetElement !== element) resetIngredientInput();
    };

    document.addEventListener("pointerup", handleOutsideClick);
    return () => document.removeEventListener("pointerup", handleOutsideClick);
  }, [editMode, resetIngredientInput, currentIngredientContent]);

  if (editMode) {
    return (
      <li
        ref={containerRef}
        className={cn(
          "ingredient-content text-left overflow-hidden items-center border border-border rounded-md transition-colors",
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-end gap-2">
            <Input 
              type="number"
              value={ingredientInput.amount}
              min={0}
              max={MAX_RECIPE_INGREDIENT_AMOUNT}
              onChange={(e) => {
                setTouched(true);
                setIngredientInput((i) => ({
                  ...i,
                  amount: Number(e.target.value)
                }));
              }}
              placeholder="0"
              className="w-24 rounded-sm shadow-none"
            />
            <Select 
              value={ingredientInput.unit}
              onValueChange={(val) => {
                setTouched(true);
                setIngredientInput((i) => ({
                  ...i,
                  unit: val as Unit["abbreviation"]
                }));
              }}
            >
              <SelectTrigger className="w-24 rounded-sm shadow-none">
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
            onChange={(e) => {
              setTouched(true);
              setIngredientInput((i) => ({
                ...i,
                name: e.target.value
              }));
            }}
            placeholder="Ingredient Name"
            className="rounded-sm shadow-none"
          />
          <div className="error-label flex flex-col gap-2 has-[ul:empty]:hidden">
            <div className="flex items-center gap-2">
              <Info size={14}/>
              <span className="font-bold text-sm">Input Errors</span>
            </div>
            <Separator className="bg-primary/33 dark:bg-border"/>
            <ul className="flex flex-col gap-1">
              {
                touched && ingredientInputError?.issues.map((i) => (
                  <li key={i.path.join("-")} className="text-xs list-inside list-disc">
                    {i.message}
                  </li>
                ))
              }
            </ul>
          </div>
          <div className="w-full @min-2xl:w-auto flex items-center gap-4 @min-2xl:gap-6">
            <button
              type="button"
              disabled={!touched || !!ingredientInputError}
              onClick={() => {
                setIngredientContent(currentIngredientIndex, ingredientInput);
                setEditMode(false);
                setTouched(false);
              }}
              className="mealicious-button text-xs font-semibold py-2 px-6 rounded-sm"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={resetIngredientInput}
              className="cursor-pointer underline text-xs font-semibold rounded-sm"
            >
              Cancel
            </button>
          </div>
        </div>
        <Separator />
        <div className="p-3">
          <Input 
            value={ingredientInput.note}
            onChange={(e) => {
              setTouched(true);
              setIngredientInput((i) => ({
                ...i,
                note: e.target.value
              }));
            }}
            placeholder="Ingredient Note"
            className="rounded-sm shadow-none"
          />
        </div>
      </li>
    );
  }
  
  return (
    <li
      ref={containerRef}
      className={cn(
        "ingredient-content text-left overflow-hidden items-center border border-border rounded-sm transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-2 p-3">
        <div className="flex justify-end items-center gap-2">
          <h1 className="font-bold text-xl mr-auto">{currentIngredientContent.amount} {currentIngredientContent.unit}</h1>
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className={cn(
              "group size-8 cursor-pointer",
              "border border-muted-foreground hover:border-mealicious-primary hover:bg-mealicious-primary",
              "hover:text-white font-semibold text-xs text-nowrap",
              "flex justify-center items-center gap-1.5",
              "py-2 px-3 rounded-full transition-colors"
            )}
          >
            <Pencil size={16} className="shrink-0 stroke-muted-foreground group-hover:stroke-white"/>
          </button>
          <button
            type="button"
            onClick={() => deleteIngredient(currentIngredientIndex)}
            className={cn(
              "group size-8 cursor-pointer",
              "border border-muted-foreground",
              "hover:bg-red-700 hover:border-red-700",
              "hover:text-white font-semibold text-xs text-nowrap",
              "flex justify-center items-center gap-1.5",
              "py-2 px-3 rounded-full transition-colors"
            )}
          >
            <Trash2 size={16} className="shrink-0 stroke-muted-foreground group-hover:stroke-white"/>
          </button>
        </div>
        <span className="w-full line-clamp-1 font-semibold text-muted-foreground max-w-48 truncate">
          {currentIngredientContent.name}
        </span>
      </div>
      <div className="flex flex-col has-[div:nth-child(2):empty]:hidden">
        <Separator />
        <div className="hyphens-auto p-3">
          {currentIngredientContent.note}
        </div>
      </div>
    </li>
  );
});

RecipeIngredient.displayName = "RecipeIngredient";
