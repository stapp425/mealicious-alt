import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RecipeCreation } from "@/lib/zod";
import { Info } from "lucide-react";
import { useState } from "react";
import { UseFormSetValue } from "react-hook-form";

type RecipeTagsProps = {
  tags: string[];
  setTags: UseFormSetValue<RecipeCreation>;
  message?: string
};

export default function RecipeTags({ tags, setTags, message }: RecipeTagsProps) {
  const [tag, setTag] = useState<string>("");
  
  return (
    <div className="field-container flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Tags</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
        <p className="font-semibold text-muted-foreground">
          Add extra tags to your recipe here. (optional)
        </p>
        <span className={cn(tags.length > 10 && "text-red-500")}>
          <b className="text-xl">{tags.length}</b> / 10
        </span>
      </div>
      {
        message && (
          <div className="error-text text-sm">
            <Info size={16}/>
            {message}
          </div>
        )
      }
      <div className="flex justify-between items-stretch gap-3">
        <Input 
          value={tag}
          placeholder="Tag"
          onChange={(e) => {
            const { value } = e.target;
            setTag(value);
          }}
        />
        <button
          disabled={!tag || tags.includes(tag) || tags.length >= 10}
          onClick={() => {
            setTags("tags", [...tags, tag]);
            setTag("");
          }}
          className="h-full mealicious-button font-semibold px-6 py-1.5 rounded-md"
        >
          Add
        </button>
      </div>
      {
        tags.length > 0 && (
          <>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <Info size={16}/>
            You can remove a tag by clicking on it.
          </div>
          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {
              tags.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTags("tags", [...tags.filter((ft) => ft !== t)])}
                  className="cursor-pointer bg-orange-500 text-white text-xs font-semibold min-w-[50px] hover:bg-red-500 hover:text-white px-3 py-1 rounded-full transition-colors"
                >
                  {t}
                </button>
              ))
            }
          </div>
          </>
        )
      }
    </div>
  );
}