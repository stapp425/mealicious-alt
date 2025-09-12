"use client";

import { editProfileAbout } from "@/lib/actions/user";
import { cn } from "@/lib/utils";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { SquarePen } from "lucide-react";
import z from "zod/v4";

type AboutSectionProps = {
  isSessionUser: boolean;
  initialAboutContent: string | null;
};

const MAX_ABOUT_LENGTH = 1000;

export default function AboutSection({ isSessionUser, initialAboutContent }: AboutSectionProps) {
  const aboutContent = useRef(initialAboutContent);
  const [editMode, setEditMode] = useState(false);
  const [input, setInput] = useState(initialAboutContent);
  const { execute, isExecuting } = useAction(editProfileAbout, {
    onExecute: () => setEditMode(false),
    onSuccess: ({ data }) => {
      aboutContent.current = data.about;
      setInput(aboutContent.current);
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError);
      setEditMode(false);
      setInput(aboutContent.current);
    }
  });

  const AboutInputSchema = useMemo(
    () => z.string({
      error: (issue) => typeof issue === "undefined"
        ? "An about input is required."
        : "Expected a string, but received an invalid type."
    }).max(MAX_ABOUT_LENGTH, {
      abort: true,
      error: `About input cannot have more than ${MAX_ABOUT_LENGTH.toLocaleString()} characters.`
    }).refine((val) => val !== aboutContent.current, {
      error: "Old and new about inputs cannot be the same."
    }),
    []
  );

  const { error: aboutInputError } = AboutInputSchema.safeParse(input || "");
  
  return (
    <section className="max-w-screen @min-2xl:max-w-full grid gap-1.5">
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
            onSubmit={(e) => {
              e.preventDefault();
              execute(input);
            }}
            className="flex flex-col gap-2"
          >
            <Textarea 
              value={input || ""}
              onChange={(e) => setInput(e.target.value || null)}
              placeholder="About"
              className="min-h-24 resize-none hyphens-auto rounded-sm shadow-none"
            />
            <span className={cn("shrink-0 text-sm", input && input.length > MAX_ABOUT_LENGTH && "text-red-500")}>
              <b className="text-base">{input?.length || 0}</b> / {MAX_ABOUT_LENGTH}
            </span>
            <div className="flex items-center gap-6">
              <button
                type="submit"
                disabled={isExecuting || !!aboutInputError}
                className="mealicious-button font-semibold text-sm py-2 px-8 rounded-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setInput(aboutContent.current);
                }}
                className="cursor-pointer text-sm underline"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className={cn(!input && "italic", "wrap-break-word hyphens-auto text-muted-foreground")}>
            {input || "No description available."}
          </p>
        )
      }
    </section>
  );
}
