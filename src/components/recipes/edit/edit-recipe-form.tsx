"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Unit, unitAbbreviations } from "@/db/data/unit";
import { diet, dishType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { MAX_DESCRIPTION_LENGTH, RecipeEdition, RecipeEditionSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InferSelectModel } from "drizzle-orm";
import { Check, ChevronDown, Clock, Info, Microwave, Clipboard, LoaderCircle, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RecipeImageUploader from "@/components/recipes/edit/recipe-image-uploader";
import RecipeTags from "@/components/recipes/edit/recipe-tags";
import RecipeTimes from "@/components/recipes/edit/recipe-times";
import RecipeDiets from "@/components/recipes/edit/recipe-diets";
import RecipeDishTypes from "@/components/recipes/edit/recipe-dish-types";
import RecipeIngredients from "@/components/recipes/edit/recipe-ingredients";
import RecipeInstructions from "@/components/recipes/edit/recipe-instructions";
import { useRouter } from "next/navigation";
import { generatePresignedUrlForImageDelete, generatePresignedUrlForImageUpload, updateRecipe, updateRecipeImage } from "@/lib/actions/db";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

type EditRecipeFormProps = {
  readonly cuisines: {
    id: string;
    adjective: string;
    countryOrigins: {
      country: {
        icon: string;
      };
    }[];
  }[];
  readonly diets: Omit<InferSelectModel<typeof diet>, "description">[];
  readonly dishTypes: Omit<InferSelectModel<typeof dishType>, "description">[];
  recipe: {
    id: string;
    description: string | null;
    title: string;
    image: string;
    tags: string[];
    cookTime: string;
    prepTime: string;
    readyTime: string;
    isPublic: boolean;
    createdBy: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    servingSizeAmount: string;
    servingSizeUnit: Unit["abbreviation"];
    cuisine: {
      id: string;
      adjective: string;
      countryOrigins: {
        country: {
          name: string;
          id: string;
          icon: string;
        };
      }[];
    } | null;
    diets: {
      diet: {
        name: string;
        id: string;
      };
    }[];
    dishTypes: {
      dishType: {
        name: string;
        id: string;
      };
    }[];
    nutritionalFacts: {
      id: string;
      unit: Unit["abbreviation"];
      amount: string;
      nutrition: {
        name: string;
        id: string;
        isMacro: boolean;
        allowedUnits: Unit["abbreviation"][];
      };
    }[];
    ingredients: {
      name: string;
      id: string;
      unit: Unit["abbreviation"];
      amount: string;
      isAllergen: boolean;
      note: string | null;
    }[];
    instructions: {
      id: string;
      description: string;
      title: string;
      time: string;
      index: number;
    }[];
  };
};

type Nutrition = {
  id: string;
  unit: Unit["abbreviation"];
  amount: string;
  nutrition: {
    name: string;
    id: string;
    isMacro: boolean;
    allowedUnits: Unit["abbreviation"][];
  };
};

export default function EditRecipeForm({ cuisines, diets, dishTypes, recipe }: EditRecipeFormProps) {  
  const { push } = useRouter();

  // put macronutrients first
  const [macro, micro] = recipe.nutritionalFacts.reduce(([a, b]: [Nutrition[], Nutrition[]], n) => {
    (n.nutrition?.isMacro ? a : b).push(n);
    return [a, b];
  }, [[], []]);

  const nutrientCutoff = macro.length;
  
  const { 
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<RecipeEdition>({
    resolver: zodResolver(RecipeEditionSchema),
    defaultValues: {
      id: recipe.id,
      title: recipe.title,
      isPublic: recipe.isPublic,
      description: recipe.description || undefined,
      source: {
        name: recipe.sourceName || undefined,
        url: recipe.sourceUrl || undefined
      },
      cuisine: {
        id: recipe.cuisine?.id,
        adjective: recipe.cuisine?.adjective,
        countryOrigins: recipe.cuisine?.countryOrigins
      },
      cookTime: Number(recipe.cookTime),
      prepTime: Number(recipe.prepTime),
      readyTime: Number(recipe.readyTime),
      diets: recipe.diets.map(({ diet }) => diet),
      dishTypes: recipe.dishTypes.map(({ dishType }) => dishType),
      tags: recipe.tags,
      ingredients: recipe.ingredients.map((i) => ({
        ...i,
        note: i.note || undefined,
        amount: Number(i.amount)
      })),
      servingSize: {
        amount: Number(recipe.servingSizeAmount),
        unit: recipe.servingSizeUnit
      },
      nutrition: [
        macro.map((n) => ({
          id: n.nutrition.id,
          name: n.nutrition.name,
          amount: Number(n.amount),
          unit: n.unit,
          allowedUnits: n.nutrition.allowedUnits
        })),
        micro.map((n) => ({
          id: n.nutrition.id,
          name: n.nutrition.name,
          amount: Number(n.amount),
          unit: n.unit,
          allowedUnits: n.nutrition.allowedUnits
        })),
      ].flat(),
      instructions: recipe.instructions.map((i) => ({
        ...i,
        time: Number(i.time)
      }))
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { image, ...dataRest } = data;
      const recipeEditionResult = await updateRecipe({ editedRecipe: dataRest });

      if (!recipeEditionResult?.data)
        throw new Error("Failed to update recipe.");

      // user has added a new image
      if (image) {
        const { url: deleteImageUrl } = await generatePresignedUrlForImageDelete(recipe.image);
        await axios.delete(deleteImageUrl);

        const imageName = `${data.id}/${image.name}`;
        const { url: insertImageUrl } = await generatePresignedUrlForImageUpload({
          name: imageName,
          size: image.size,
          type: image.type
        });

        await axios.put(insertImageUrl, image, {
          headers: {
            "Content-Type": image.type
          }
        });

        const updateRecipeImageResult = await updateRecipeImage({ 
          recipeId: data.id,
          imageName
        });

        if (!updateRecipeImageResult?.data)
          throw new Error("Failed to add image to the recipe.");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload the recipe image.");
      } else if (err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }
    
    toast.success("Recipe successfully edited!");
    reset(data);
    push(`/recipes/${data.id}`);
  });

  const currentCuisine = watch("cuisine");
  const currentDescription = watch("description") || "";
  const currentNutrition = watch("nutrition");

  return (
    <form 
      onSubmit={onSubmit} 
      className="max-w-[750px] xl:max-w-[1250px] w-full bg-background mx-auto p-4"
    >
      <h1 className="text-4xl font-bold mb-6">Edit Recipe</h1>
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="w-full xl:w-[500px] flex flex-col gap-3">
          <RecipeImageUploader
            image={watch("image")}
            setImage={setValue}
            message={errors.image?.message}
            recipeImageUrl={recipe.image}
          />
          <div className="flex xl:hidden flex-col gap-3 field-container ">
            <h2 className="required-field font-bold text-2xl">
              Title
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <p className="font-semibold text-muted-foreground">
                Add a title to your recipe here.
              </p>
              <span className={cn(watch("title").length > 100 && "text-red-500")}>
                <b className="text-xl">{watch("title").length}</b> / 100
              </span>
            </div>
            <Input
              {...register("title")}
              placeholder="Title"
              className="h-[50px] font-bold"
            />
            <div className="flex items-center gap-3">
              <Checkbox
                id="isPublic"
                {...register("isPublic")}
              />
              <label
                htmlFor="isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Make Recipe Public
              </label>
            </div>
            {
              errors.title?.message && (
                <div className="error-text text-sm">
                  <Info size={16}/>
                  {errors.title?.message}
                </div>
              )
            }
          </div>
          <div className="field-container flex flex-col gap-3">
            <h2 className="font-bold text-2xl">
              Cuisine
            </h2>
            <p className="font-semibold text-muted-foreground">
              Add the type of cuisine for this recipe here. (optional)
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="cursor-pointer flex-1 justify-between"
                >
                  {currentCuisine?.id && currentCuisine?.adjective ? currentCuisine.adjective : "Select a cuisine..."}
                  <ChevronDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[clamp(250px,25vw,450px)] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search cuisine..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>
                      No cuisines found.
                    </CommandEmpty>
                    <CommandGroup>
                      {
                        cuisines.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.adjective}
                            onSelect={(val) => setValue("cuisine", cuisines.find(({ adjective }) => adjective === val)!)}
                          >
                            <div className="flex items-center gap-2">
                              {
                                c.countryOrigins[0].country.icon && (
                                  <Image
                                    src={c.countryOrigins[0].country.icon} 
                                    alt={`Origin of ${c.adjective} cuisine`}
                                    width={35}
                                    height={35}
                                    className="rounded-full shadow-sm"
                                  />
                                )
                              }
                              {c.adjective}
                            </div>
                            <Check
                              className={cn(
                                "ml-auto",
                                c.id === currentCuisine?.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <RecipeTags 
            tags={watch("tags")}
            setTags={setValue}
            message={errors.tags?.message}
          />
          <div className="field-container flex flex-col gap-3">
            <h1 className="text-2xl font-bold">Source</h1>
            <p className="text-muted-foreground font-semibold">
              Add a source name and URL if you have found this recipe somewhere else. (optional)
            </p>
            {
              errors.source?.name?.message && (
                <div className="error-text">
                  <Info size={14}/>
                  {errors.source?.name?.message}
                </div>
              )
            }
            <Input 
              {...register("source.name")}
              placeholder="Source Name (optional)"
            />
            {
              errors.source?.url?.message && (
                <div className="error-text">
                  <Info size={14}/>
                  {errors.source?.url?.message}
                </div>
              )
            }
            <Input 
              {...register("source.url")}
              placeholder="Source URL (optional)"
            />
            {
              errors.source?.message && (
                <div className="error-text">
                  <Info size={14}/>
                  {errors.source?.message}
                </div>
              )
            }
          </div>
          <RecipeTimes
            register={register}
            recipeTimesDetails={[
              {
                icon: Clock,
                label: "Prep Time",
                field: "prepTime",
                message: errors.prepTime?.message
              },
              {
                icon: Microwave,
                label: "Cook Time",
                field: "cookTime",
                message: errors.cookTime?.message
              },
              {
                icon: Clipboard,
                label: "Ready Time",
                field: "readyTime",
                message: errors.readyTime?.message
              }
            ]}
          />
          <button
            disabled={isSubmitting}
            type="submit"
            className="hidden xl:flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
          >
            {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Edit Recipe"}
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <div className="hidden xl:flex flex-col gap-3 field-container ">
            <h2 className="required-field font-bold text-2xl">
              Title
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <p className="font-semibold text-muted-foreground">
                Add a title to your recipe here.
              </p>
              <span className={cn(watch("title").length > 100 && "text-red-500")}>
                <b className="text-xl">{watch("title").length}</b> / 100
              </span>
            </div>
            <Input
              className="h-[50px] font-bold"
              {...register("title")}
              placeholder="Title"
            />

            <div className="flex items-center gap-3">
              <Checkbox
                id="isPublic"
                {...register("isPublic")}
              />
              <label
                htmlFor="isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Make Recipe Public
              </label>
            </div>
            {
              errors.title?.message && (
                <div className="error-text text-sm">
                  <Info size={16}/>
                  {errors.title?.message}
                </div>
              )
            }
          </div>
          <div className="field-container flex flex-col gap-3">
            <h1 className="text-2xl font-bold">Description</h1>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
              <p className="text-muted-foreground font-semibold">
                Add a brief description about your recipe here. (optional)
              </p>
              <span className={cn(currentDescription.length > MAX_DESCRIPTION_LENGTH && "text-red-500")}>
                <b className="text-xl">{currentDescription.length}</b> / {MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <Textarea
              {...register("description")}
              spellCheck={false}
              placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Aliquam nulla facilisi cras fermentum odio eu feugiat pretium nibh."
              autoComplete="off"
              className="min-h-[100px] break-all flex-1 flex rounded-md"
            />
            {
              errors.description?.message &&
              <div className="error-text text-sm">
                <Info size={16}/>
                {errors.description?.message}
              </div> 
            }
          </div>
          <RecipeDiets 
            diets={diets}
            formDietValues={watch("diets")}
            setDiets={setValue}
            message={errors.diets?.message}
          />
          <RecipeDishTypes 
            dishTypes={dishTypes}
            formDishTypeValues={watch("dishTypes")}
            setDishTypes={setValue}
            message={errors.dishTypes?.message}
          />
          <div className="field-container flex flex-col justify-between">
            <h1 className="font-bold text-2xl required-field">Nutrition</h1>
            {
              errors.servingSize?.amount?.message && (
                <div className="error-text">
                  <Info size={14}/>
                  {errors.servingSize?.amount?.message}
                </div>
              )
            }
            {
              errors.servingSize?.unit?.message && (
                <div className="error-text">
                  <Info size={14}/>
                  {errors.servingSize?.unit?.message}
                </div>
              )
            }
            <div className="flex justify-end items-center gap-3">
              <h1 className="font-semibold my-2 mr-auto">Serving Size:</h1>
              <Input
                type="number"
                min={0}
                max={9999.99}
                step="any"
                className="w-[100px]"
                {...register("servingSize.amount")} 
              />
              <Select defaultValue="g" {...register("servingSize.unit")}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="unit"/>
                </SelectTrigger>
                <SelectContent className="max-h-46">
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
            <div className="flex flex-col gap-3">
              {
                currentNutrition.slice(0, nutrientCutoff).map((rn, i) => (
                  <div key={rn.id} className="flex flex-col gap-3">
                    {
                      errors?.nutrition?.[i]?.amount?.message && (
                        <div className="flex items-center gap-3 text-xs text-red-500">
                          <Info size={14}/>
                          {errors?.nutrition?.[i]?.amount?.message}
                        </div>
                      )
                    }
                    <div className="flex justify-between items-center gap-3">
                      <Input
                        defaultValue={rn.name}
                        disabled
                        className="flex-1 disabled:text-primary"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={9999.99}
                        step="any"
                        {...register(`nutrition.${i}.amount`)}
                        className="w-[100px]"
                      />
                      <Select 
                        disabled={rn.allowedUnits.length <= 1}
                        {...register(`nutrition.${i}.unit`)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder={rn.allowedUnits.length > 0 ? rn.allowedUnits[0] : "unit"}/>
                        </SelectTrigger>
                        <SelectContent>
                          {
                            rn.allowedUnits.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              }
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full cursor-pointer flex justify-between items-center">
                    More Nutrition
                    <Plus />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <div className="flex flex-col gap-3 mt-3">
                    {
                      currentNutrition.slice(nutrientCutoff).map((rn, i) => (
                        <div key={rn.id} className="flex flex-col gap-3">
                          {
                            errors?.nutrition?.[i]?.amount?.message && (
                              <div className="flex items-center gap-3 text-xs text-red-500">
                                <Info size={14}/>
                                {errors?.nutrition?.[i]?.amount?.message}
                              </div>
                            )
                          }
                          <div className="flex justify-between items-center gap-3">
                            <Input
                              defaultValue={rn.name}
                              disabled
                              className="flex-1 disabled:text-primary"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={9999.99}
                              step="any"
                              {...register(`nutrition.${i + nutrientCutoff}.amount`)}
                              className="w-[100px]"
                            />
                            <Select 
                              disabled={rn.allowedUnits.length <= 1}
                              {...register(`nutrition.${i}.unit`)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder={rn.allowedUnits.length > 0 ? rn.allowedUnits[0] : "unit"}/>
                              </SelectTrigger>
                              <SelectContent>
                                {
                                  rn.allowedUnits.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          <RecipeIngredients
            formIngredientValues={watch("ingredients")}
            setIngredients={setValue}
            message={errors?.ingredients?.message}
          />
          <RecipeInstructions 
            formInstructionValues={watch("instructions")}
            setInstructions={setValue}
            message={errors?.instructions?.message}
          />
          <button
            disabled={isSubmitting}
            type="submit" 
            className="flex xl:hidden mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
          >
            {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Edit Recipe"}
          </button>
        </div>
      </div>
    </form>
  );
}