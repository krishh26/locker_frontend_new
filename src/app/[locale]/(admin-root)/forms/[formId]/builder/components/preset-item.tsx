"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRESET_FIELDS, roleIcons, type PresetField } from "../utils/preset-data";

interface DraggablePresetFieldProps {
  preset: PresetField;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function DraggablePresetField({
  preset,
  onDragStart,
  onDragEnd,
}: DraggablePresetFieldProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "application/preset-field",
      JSON.stringify(preset.field)
    );
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
      className="p-2 cursor-grab active:cursor-grabbing transition-all hover:bg-primary/5 hover:border-primary"
    >
      <span className="text-sm font-medium">{preset.label}</span>
    </Card>
  );
}

interface PresetItemProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function PresetItem({ onDragStart, onDragEnd }: PresetItemProps) {
  return (
    <Accordion type="multiple" className="w-full">
      {Object.entries(PRESET_FIELDS).map(([role, fields]) => (
        <AccordionItem key={role} value={role}>
          <AccordionTrigger className="capitalize">
            <div className="flex items-center gap-2">
              <span>{roleIcons[role]}</span>
              <span className="font-semibold">{role}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {fields.map((preset: PresetField) => (
                  <DraggablePresetField
                    key={preset.type}
                    preset={preset}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
