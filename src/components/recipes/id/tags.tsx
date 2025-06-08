import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

type TagsProps = {
  tags: string[];
};

export default function Tags({ tags }: TagsProps) {
  return (
    <div className="overflow-hidden bg-sidebar border border-border flex flex-col rounded-md">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 py-2 px-3">
            <h2 className="font-bold text-lg">Tags</h2>
            <Info size={16} className="cursor-pointer"/>
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-xs font-semibold text-muted-foreground p-3" align="start">
          Any other identifiers that describe this recipe.
        </PopoverContent>
      </Popover>
      <Separator />
      <div className="flex flex-wrap gap-2 p-3">
        {
          tags.map((t, i) => (
            <Badge key={i} className="bg-mealicious-primary text-white px-3 rounded-full">
              {t}
            </Badge>
          ))
        }
      </div>
    </div>
  );
}
