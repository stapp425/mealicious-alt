"use client";

import { ChangeProfilePictureFormSchema, ImageSchema, maxFileSize, type ChangeProfilePictureForm } from "@/lib/zod/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Check, LoaderCircle, Pencil, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import defaultProfilePicture from "@/img/default/default-pfp.jpg";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { generatePresignedUrlForImageUpload } from "@/lib/actions/r2";
import { updateProfilePicture } from "@/lib/actions/settings";
import axios, { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ChangeAvatarFormProps = {
  id: string;
  avatarImageUrl: string | null;
};

export default function ChangeProfilePictureForm({ id, avatarImageUrl }: ChangeAvatarFormProps) {
  const { update } = useSession();
  const { refresh } = useRouter();
  const addImageButton = useRef<HTMLInputElement>(null);
  const [imageURL, setImageURL] = useState<string | null>(avatarImageUrl);
  const { 
    setValue,
    control,
    handleSubmit,
    reset,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm<ChangeProfilePictureForm>({
    resolver: zodResolver(ChangeProfilePictureFormSchema)
  });
  const currentImage = useWatch({ control, name: "image" });
  const onSubmit = handleSubmit(async ({ image }) => {
    if (!image) {
      toast.error("An image is required.");
      return;
    }

    try {
      const bucketImageName = `users/${id}/profile-picture/${image.name}`;
      const { url } = await generatePresignedUrlForImageUpload({
        name: bucketImageName,
        size: image.size,
        type: image.type
      });

      await axios.put(url, image, {
        headers: {
          "Content-Type": image.type
        }
      });

      const updateProfilePictureResult = await updateProfilePicture({ imageURL: bucketImageName });
      if (!updateProfilePictureResult?.data?.success) throw new Error("Failed to update profile picture.");

      toast.success(updateProfilePictureResult.data.message);
      await update({ image: imageURL });
      reset({ image });
      refresh();
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error("Failed to upload profile picture.");
      } else if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  });

  useEffect(() => {
    if (!currentImage) {
      if (addImageButton.current) addImageButton.current.value = "";
      setImageURL(avatarImageUrl);
      return;
    }

    const url = URL.createObjectURL(currentImage);
    setImageURL(url);
    return () => URL.revokeObjectURL(url);
  }, [currentImage]);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <h1 className="font-bold text-xl">Profile Picture</h1>
      <p className="text-muted-foreground">Change how others see your profile picture.</p>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-1.5 h-full">
        <Input
          ref={addImageButton}
          type="file"
          accept="image/jpg,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const addedFile = e.target.files?.[0];
            if (!addedFile) return;

            const validateFile = ImageSchema.safeParse(addedFile);
            if (!validateFile.success) {
              toast.error(validateFile.error.errors[0].message);
              e.target.value = "";
              return;
            }
            
            setValue(
              "image",
              validateFile.data,
              { shouldDirty: true }
            );
          }}
          className="hidden"
        />
        <div className="relative aspect-square size-48 sm:size-auto sm:h-full rounded-full overflow-hidden">
          <Image 
            src={imageURL || defaultProfilePicture}
            alt="Your current avatar image"
            fill
            className="object-cover object-center bg-slate-100"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-center sm:justify-start items-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => addImageButton.current?.click()}
              className="mealicious-button font-semibold text-sm flex items-center gap-2 py-1.5 px-4.5 rounded-sm"
            >
              <Pencil size={16}/>
              Edit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "mealicious-button w-24 font-semibold text-sm flex justify-center items-center gap-2 py-1.5 px-4.5 rounded-sm",
                !isDirty && "hidden"
              )}
            >
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin"/> : <><Check size={18} className="shrink-0"/>Save</>}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className={cn(
                "border border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400 cursor-pointer text-white hover:bg-red-700 dark:hover:bg-red-600 hover:border-red-700 dark:hover:border-red-600 font-semibold text-sm h-full flex items-center gap-2 py-1.5 px-2.5 rounded-sm transition-colors",
                (!isDirty || isSubmitting) && "hidden"
              )}
            >
              <Trash size={18}/>
            </button>
          </div>
          <h2 className="text-center sm:text-left text-muted-foreground">
            {maxFileSize.label} Maximum File Size
          </h2>
          <h2 className="text-center sm:text-left font-light text-sm text-wrap text-muted-foreground">
            Accepted File Extensions are .jpeg, .jpg, .png, .webp
          </h2>
        </div>
      </div>
    </form>
  );
}
