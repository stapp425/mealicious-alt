"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImageDataSchema, RecipeCreation } from "@/lib/zod";
import { Info, Plus } from "lucide-react";
import { 
  useEffect, 
  useRef, 
  useState
} from "react";
import Image from "next/image";
import defaultRecipeImage from "@/img/default/default-background.jpg";
import { UseFormSetValue } from "react-hook-form";

type ImageUploaderProps = {
  className?: string;
  image: File | null;
  setImage: UseFormSetValue<RecipeCreation>;
  message?: string;
};

export default function RecipeImageUploader({ className, image, setImage, message }: ImageUploaderProps) {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const addImageButton = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if(image) {
      const url = URL.createObjectURL(image);
      setImageURL(url);
    }

    return () => {
      if (imageURL)
        URL.revokeObjectURL(imageURL);
    };
  }, [image]);
  
  return (
    <div className={cn(`h-[425px] flex flex-col overflow-hidden relative group bg-slate-200 rounded-md`, className)}>
      <Input
        ref={addImageButton}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const addedImage = e.target.files?.[0];
          
          if (!addedImage)
            return;
          
          const imageValidityCheck = ImageDataSchema.safeParse({
            name: addedImage?.name,
            size: addedImage?.size,
            type: addedImage?.type
          });

          if (imageValidityCheck.success)
            setImage("image", addedImage);
        }}
        className="hidden"
      />
      {
        image ? (
          <>
          <Image
            src={imageURL || defaultRecipeImage}
            alt="Added Image"
            fill
            className="size-full object-cover"
          />
          <h1 className="absolute top-2 left-2 bg-mealicious-primary size-fit select-none text-white font-semibold text-sm px-3 py-1 rounded-md">{image.type.split("/")[1].toUpperCase()}</h1>
          <div className="absolute bottom-0 w-full flex justify-between items-center gap-2 p-2">
            <button
              type="button"
              onClick={() => addImageButton.current?.click()}
              className="mealicious-button font-semibold text-white text-nowrap text-xs py-1 px-3 rounded-md"
            >
              Change Image
            </button>
          </div>
          </>
        ) : (
          <div className="size-full flex flex-col justify-between gap-[100px] p-4">
            <div className="content-placeholder flex-1 relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Plus size={64}/>
              <button
                type="button"
                onClick={() => addImageButton.current?.click()}
                className="mealicious-button text-base px-5 py-2.5 rounded-md"
              >
                Add an Image
              </button>
            </div>
            {
              message && (
                <div className="error-label">
                  <Info />
                  {message}
                </div>
              )
            }
          </div>
        )
      }
    </div>
  );
}