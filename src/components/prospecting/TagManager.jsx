import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_TAGS,
  TAG_COLOR_MAP,
  getTagColor,
  getTagLabel,
} from "@/config/prospectConstants";

export default function TagManager({ prospect, onUpdateTags }) {
  const tags = prospect.tags || [];
  const [justSaved, setJustSaved] = useState(false);
  const prevTagsRef = useRef(tags);

  // Feedback visuel "sauvegardé" quand les tags changent
  useEffect(() => {
    if (JSON.stringify(prevTagsRef.current) !== JSON.stringify(tags)) {
      prevTagsRef.current = tags;
      setJustSaved(true);
      const timer = setTimeout(() => setJustSaved(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [tags]);

  const handleToggleTag = (tagId) => {
    const newTags = tags.includes(tagId)
      ? tags.filter((t) => t !== tagId)
      : [...tags, tagId];
    onUpdateTags(newTags);
  };

  return (
    <div className="space-y-3">
      {/* Tags actifs — retrait rapide par clic */}
      {tags.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {tags.length} tag{tags.length > 1 ? "s" : ""} actif{tags.length > 1 ? "s" : ""}
            </Label>
            <span
              className={cn(
                "text-xs flex items-center gap-1 transition-opacity duration-300",
                justSaved ? "opacity-100 text-green-500" : "opacity-0"
              )}
            >
              <Check className="w-3 h-3" />
              Sauvegardé
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tagId) => (
              <Badge
                key={tagId}
                variant="outline"
                onClick={() => handleToggleTag(tagId)}
                className={cn(
                  "cursor-pointer hover:opacity-70 transition-all group/tag",
                  TAG_COLOR_MAP[getTagColor(tagId)]
                )}
              >
                {getTagLabel(tagId)}
                <X className="w-3 h-3 ml-1 opacity-50 group-hover/tag:opacity-100 transition-opacity" />
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Aucun tag — sélectionnez ci-dessous</p>
      )}

      {/* Sélecteur de tags — toujours visible */}
      <div className="grid grid-cols-2 gap-1.5">
        {AVAILABLE_TAGS.map((tag) => {
          const isActive = tags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-xs transition-all border",
                isActive
                  ? cn("border-current font-medium", TAG_COLOR_MAP[tag.color])
                  : "border-transparent bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Checkbox
                checked={isActive}
                onCheckedChange={() => handleToggleTag(tag.id)}
                className="pointer-events-none"
              />
              <span className="truncate">{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
