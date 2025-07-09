"use client";

import { editProfileAbout } from "@/lib/actions/user";
import { cn } from "@/lib/utils";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { SquarePen } from "lucide-react";

type AboutSectionProps = {
  isSessionUser: boolean;
  about: string | null;
};

const MAX_ABOUT_LENGTH = 1000;

export default function AboutSection({ isSessionUser, about }: AboutSectionProps) {
  const aboutContent = useRef(about);
  const [editMode, setEditMode] = useState(false);
  const [aboutInput, setAboutInput] = useState(about);
  const { executeAsync, isExecuting, optimisticState } = useOptimisticAction(editProfileAbout, {
    currentState: aboutContent.current,
    updateFn: (_, data) => data.newAbout,
    onExecute: () => {
      setEditMode(false);
    },
    onSuccess: ({ data }) => {
      setAboutInput(data?.about || null);
      aboutContent.current = data?.about || null;
    },
    onError: () => {
      toast.error("There was an error updating the about me section.");
      setEditMode(false);
    }
  });
  
  return (
    <section className="max-w-screen sm:max-w-none grid gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-xl">About</h2>
        {
          isSessionUser && (
            <SquarePen 
              size={18}
              onClick={() => setEditMode((e) => !e)}
              className="cursor-pointer"
            />
          )
        }
      </div>
      {
        editMode ? (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              await executeAsync({ newAbout: aboutInput });
            }}
            className="flex flex-col gap-2"
          >
            <span className={cn(aboutInput && aboutInput.length > MAX_ABOUT_LENGTH && "text-red-500")}>
              <b className="text-xl">{aboutInput?.length || 0}</b> / {MAX_ABOUT_LENGTH}
            </span>
            <Textarea 
              value={aboutInput || ""}
              onChange={(e) => setAboutInput(e.target.value)}
              placeholder="Add an about here..."
              className="min-h-[150px] resize-y line-clamp-3 hyphens-auto"
            />
            <div className="flex justify-end items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setAboutInput(aboutContent.current);
                }}
                className="cursor-pointer underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isExecuting || 
                  !aboutInput || 
                  aboutInput.length > MAX_ABOUT_LENGTH || 
                  aboutInput === optimisticState
                }
                className="mealicious-button font-semibold text-sm py-2 px-8 rounded-sm"
              >
                Edit
              </button>
            </div>
          </form>
        ) : (
          <p className={cn(!about && "italic", "wrap-break-word hyphens-auto text-muted-foreground")}>
            {optimisticState}
          </p>
        )
      }
    </section>
  );
}