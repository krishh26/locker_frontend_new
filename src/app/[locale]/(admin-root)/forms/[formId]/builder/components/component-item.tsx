"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ComponentItemProps {
  component: {
    type: string;
    label: string;
    icon: string;
  };
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onAdd?: (type: string) => void;
  addLabel?: string;
}

export function ComponentItem({
  component,
  onDragStart,
  onDragEnd,
  onAdd,
  addLabel,
}: ComponentItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/component-type", component.type);
    onDragStart?.();
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="p-3 cursor-grab active:cursor-grabbing transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{component.icon}</span>
        <span className="flex-1 text-sm font-medium">{component.label}</span>
        {onAdd && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 shrink-0 p-0"
            onClick={() => onAdd(component.type)}
            aria-label={addLabel}
            title={addLabel}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
