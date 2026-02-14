"use client";

import { Card } from "@/components/ui/card";

interface ComponentItemProps {
  component: {
    type: string;
    label: string;
    icon: string;
  };
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function ComponentItem({
  component,
  onDragStart,
  onDragEnd,
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
      className="p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-primary hover:border-primary"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{component.icon}</span>
        <span className="text-sm font-medium">
          {component.label.replace(/^[^\s]+ /, "")}
        </span>
      </div>
    </Card>
  );
}
