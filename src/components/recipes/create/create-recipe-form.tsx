"use client";

import { diet, dishType, nutrition, recipe } from "@/db/schema/recipe";
import { MAX_DESCRIPTION_LENGTH, RecipeCreation, RecipeCreationSchema, UrlSchema } from "@/lib/zod";
import { eq, InferSelectModel } from "drizzle-orm";
import { Clock, Info, LoaderCircle, Microwave, Clipboard, ChevronDown, Check, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { unitAbbreviations } from "@/db/data/unit";
import { useMediaQuery } from "usehooks-ts";
import RecipeImageUploader from "@/components/recipes/create/recipe-image-uploader";
import RecipeTags from "@/components/recipes/create/recipe-tags";
import RecipeTimes from "@/components/recipes/create/recipe-times";
import RecipeDiets from "@/components/recipes/create/recipe-diets";
import RecipeDishTypes from "@/components/recipes/create/recipe-dish-types";
import RecipeIngredients from "@/components/recipes/create/recipe-ingredients";
import RecipeInstructions from "@/components/recipes/create/recipe-instructions";
import Image from "next/image";
import { createRecipe, updateRecipeImage } from "@/lib/actions/db";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type CreateRecipeFormProps = {
  readonly nutrition: Omit<InferSelectModel<typeof nutrition>, "description">[];
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
};

export default function CreateRecipeForm({ nutrition, cuisines, diets, dishTypes }: CreateRecipeFormProps) {  
  const matches = useMediaQuery("(min-width: 80rem)");

  // put macronutrients first
  const [macro, micro] = nutrition.reduce(([a, b]: [typeof nutrition, typeof nutrition], n) => {
    (n.isMacro ? a : b).push(n);
    return [a, b];
  }, [[], []]);

  const nutrientCutoff = macro.length;
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { 
      errors,
      isSubmitting
    }
  } = useForm<RecipeCreation>({
    resolver: zodResolver(RecipeCreationSchema),
    mode: "onSubmit",
    delayError: 250,
    defaultValues: {
      title: "",
      description: "",
      cookTime: 0,
      prepTime: 0,
      readyTime: 0,
      isPublic: false,
      servingSize: {
        amount: 0,
        unit: "g"
      },
      cuisine: {
        id: "",
        adjective: "",
        countryOrigins: [
          {
            country: {
              icon: ""
            }
          }
        ]
      },
      diets: [],
      dishTypes: [],
      ingredients: [],
      instructions: [],
      nutrition: [
        macro.map((n) => ({
          ...n,
          unit: n.allowedUnits.length > 0 ? n.allowedUnits[0] : "g",
          amount: 0
        })),
        micro.map((n) => ({
          ...n,
          unit: n.allowedUnits.length > 0 ? n.allowedUnits[0] : "g",
          amount: 0
        })),
      ].flat(),
      tags: []
    }
  });

  const currentCuisine = watch("cuisine");
  const currentDescription = watch("description") || "";

  const handleUnload = (e: BeforeUnloadEvent) => e.preventDefault();
  useEffect(() => {
    addEventListener("beforeunload", handleUnload);
    return () => removeEventListener("beforeunload", handleUnload);
  }, []);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const { image, ...formDataRest } = formData;
      const recipeCreationResult = await createRecipe({ createdRecipe: formDataRest });

      if (!recipeCreationResult?.data)
        throw new Error("Failed to create recipe.");

      const { data: recipeId } = recipeCreationResult;
      const imageName = `${recipeId}/${image.name}`
      const imageLinkResult = await axios.post("/api/image/link", {
        name: imageName,
        type: image.type,
        size: image.size
      });

      const parsedLink = UrlSchema.safeParse(imageLinkResult.data);

      if (!parsedLink.success)
        throw new Error("Failed to generate a link for the image.");

      const { url: imageUploadUrl } = parsedLink.data;
      
      await axios.put(imageUploadUrl, image, {
        headers: {
          "Content-Type": image.type
        }
      });

      const updateRecipeImageResult = await updateRecipeImage({ recipeId, imageName });

      if (!updateRecipeImageResult?.data?.success)
        throw new Error("Failed to add image to the recipe.");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload the recipe image.");
      } else if (err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }

    toast.success("Recipe successfully created!");
    reset();
  });
  
  return (
    <form 
      onSubmit={onSubmit} 
      className="max-w-[750px] xl:max-w-[1250px] w-full bg-background mx-auto p-4"
    >
      <h1 className="text-4xl font-bold mb-6">Create a Recipe</h1>
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="w-full xl:w-[500px] flex flex-col gap-3">
          <RecipeImageUploader
            image={watch("image")}
            setImage={setValue}
            message={errors.image?.message}
          />
          {
            !matches && (
              <div className="field-container flex flex-col gap-3">
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
            )
          }
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
          {
            matches && (
              <button
                disabled={isSubmitting}
                type="submit" 
                className="hidden xl:flex mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
              >
                {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Create Recipe"}
              </button>
            )
          }
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {
            matches && (
              <div className="field-container flex flex-col gap-3">
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
            )
          }
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
                nutrition.slice(0, nutrientCutoff).map((rn, i) => (
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
                      nutrition.slice(nutrientCutoff).map((rn, i) => (
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
          {
            !matches && (
              <button
                disabled={isSubmitting}
                type="submit" 
                className="flex xl:hidden mealicious-button justify-center items-center font-bold px-6 py-3 rounded-md"
              >
                {isSubmitting ? <LoaderCircle className="animate-spin"/> : "Create Recipe"}
              </button>
            )
          }
        </div>
      </div>
    </form>
  );
}