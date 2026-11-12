"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SimpleFormField } from "@/store/api/forms/types";
import { PRESET_FIELDS, roleIcons, type PresetField } from "../utils/preset-data";

interface DraggablePresetFieldProps {
  preset: PresetField;
  label: string;
  addLabel: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onAdd?: (field: SimpleFormField) => void;
}

function DraggablePresetField({
  preset,
  label,
  addLabel,
  onDragStart,
  onDragEnd,
  onAdd,
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
      className="p-2 cursor-grab active:cursor-grabbing transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-medium">{label}</span>
        {onAdd && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 w-6 shrink-0 p-0"
            onClick={() => onAdd(preset.field)}
            aria-label={addLabel}
            title={addLabel}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}

interface PresetItemProps {
  onDragStart: () => void;
  onDragEnd: () => void;
  onAdd?: (field: SimpleFormField) => void;
}

export function PresetItem({ onDragStart, onDragEnd, onAdd }: PresetItemProps) {
  const t = useTranslations("forms.builder.presets");
  const tPalette = useTranslations("forms.builder.palette");
  return (
    <Accordion type="multiple" className="w-full">
      {Object.entries(PRESET_FIELDS).map(([role, fields]) => (
        <AccordionItem key={role} value={role}>
          <AccordionTrigger className="capitalize">
            <div className="flex items-center gap-2">
              <span>{roleIcons[role]}</span>
              <span className="font-semibold">{t(`roles.${role}`)}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {fields.map((preset: PresetField) => (
                  <DraggablePresetField
                    key={preset.type}
                    preset={preset}
                    label={t(`fields.${preset.type}`)}
                    addLabel={tPalette("addToForm")}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onAdd={onAdd}
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
