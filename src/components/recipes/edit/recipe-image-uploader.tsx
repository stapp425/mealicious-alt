"use client";

import { Input } from "@/components/ui/input";
import { ImageSchema } from "@/lib/zod/recipe";
import { Info, Plus } from "lucide-react";
import { 
  ChangeEvent,
  ComponentProps,
  useCallback,
  useEffect, 
  useRef, 
  useState
} from "react";
import Image from "next/image";
import defaultRecipeImage from "@/img/default/default-background.jpg";
import { useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  recipeImageURL: string;
};

export default function RecipeImageUploader({ 
  recipeImageURL,
  className,
  ...props
}: ImageUploaderProps & Omit<ComponentProps<"section">, "children">) {
  const { control, setValue } = useEditRecipeFormContext();
  const { 
    errors: {
      image: imageError
    }
  } = useFormState({ control, name: "image" });
  const image = useWatch({ control, name: "image" });
  const [imageURL, setImageURL] = useState<string>(recipeImageURL);
  const addImageButton = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const addedImage = e.target.files[0];
    
    const imageValidation = ImageSchema.safeParse(addedImage);
    if (!imageValidation.success) {
      const errors = imageValidation.error.issues.map(({ message }) => message);
      toast.error(errors, {
        duration: 10000
      });
      e.target.value = "";
      return;
    }

    setValue(
      "image",
      addedImage,
      { shouldDirty: true }
    );
  }, [setValue]);
  
  useEffect(() => {
    if (!image) {
      if (addImageButton.current) addImageButton.current.value = "";
      setImageURL(recipeImageURL);
      return;
    }
    
    const url = URL.createObjectURL(image);
    setImageURL(url);
    return () => URL.revokeObjectURL(url);
  }, [image, setImageURL, recipeImageURL]);
  
  return (
    <section 
      {...props}
      className={cn(
        "bg-sidebar border border-border h-108 flex flex-col overflow-hidden relative group rounded-md",
        className
      )}
    >
      <Input
        ref={addImageButton}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />
      {
        imageURL ? (
          <>
          <Image
            src={imageURL || defaultRecipeImage}
            alt="Added Image"
            fill
            className="size-full object-cover"
          />
          {image && <h1 className="absolute top-2 left-2 bg-mealicious-primary size-fit select-none text-white font-semibold text-sm px-3 py-1 rounded-md">{image.type.split("/")[1].toUpperCase()}</h1>}
          <div className="absolute bottom-0 w-full flex justify-between items-center gap-2 p-2">
            <button
              type="button"
              onClick={() => addImageButton.current?.click()}
              className="mealicious-button font-semibold text-white text-nowrap text-xs py-1 px-3 rounded-md"
            >
              Change Image
            </button>
            {
              recipeImageURL !== imageURL && (
                <button
                  type="button"
                  onClick={() => {
                    setImageURL(recipeImageURL);
                    setValue(
                      "image",
                      null,
                      { shouldDirty: false }
                    );
                  }}
                  className="cursor-pointer bg-red-500 hover:bg-red-700 font-semibold text-white text-nowrap text-xs py-1 px-3 rounded-md"
                >
                  Clear
                </button>
              )
            }
          </div>
          </>
        ) : (
          <div className="size-full flex flex-col justify-between p-4">
            <div className="flex flex-col justify-center text-muted-foreground items-center gap-4 flex-1 relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Plus size={64}/>
              <button
                type="button"
                onClick={() => addImageButton.current?.click()}
                className="font-semibold mealicious-button text-base px-5 py-2.5 rounded-md"
              >
                Add an Image
              </button>
            </div>
            {
              imageError?.message && (
                <div className="error-label">
                  <Info />
                  {imageError.message}
                </div>
              )
            }
          </div>
        )
      }
    </section>
  );
}