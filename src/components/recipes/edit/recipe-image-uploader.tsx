"use client";

import { Input } from "@/components/ui/input";
import { ImageSchema } from "@/lib/zod/recipe";
import { Info, Plus } from "lucide-react";
import { 
  useEffect, 
  useRef, 
  useState
} from "react";
import Image from "next/image";
import defaultRecipeImage from "@/img/default/default-background.jpg";
import { useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useEditRecipeFormContext } from "@/components/recipes/edit/edit-recipe-form";

type ImageUploaderProps = {
  recipeImageURL: string;
};

export default function RecipeImageUploader({ recipeImageURL }: ImageUploaderProps) {
  const { control, setValue } = useEditRecipeFormContext();
  const { 
    errors: {
      image: imageError
    }
  } = useFormState({ control, name: "image" });
  const image = useWatch({ control, name: "image" });
  const [imageURL, setImageURL] = useState<string>(recipeImageURL);
  const addImageButton = useRef<HTMLInputElement>(null);
  
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
    <div className="bg-sidebar border border-border h-[425px] flex flex-col overflow-hidden relative group rounded-md">
      <Input
        ref={addImageButton}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const addedImage = e.target.files?.[0];
          
          if (!addedImage)
            return;
          
          const validateImage = ImageSchema.safeParse(addedImage);
          if (!validateImage.success) {
            toast.error(validateImage.error.message);
            e.target.value = "";
            return;
          }

          setValue("image", addedImage);
        }}
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
                    setValue("image", null);
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
    </div>
  );
}