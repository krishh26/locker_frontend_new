"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { surveyTemplates, type SurveyTemplate } from "./templates"

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: SurveyTemplate) => void
}

export function TemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const handleSelectTemplate = (template: SurveyTemplate) => {
    onSelectTemplate(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create from featured templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly get started with pre-filled questions
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {surveyTemplates.map((template) => (
            <Card
              key={template.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectTemplate(template)}
            >
              <div
                className="h-32 w-full relative"
                style={{
                  background: template.background.value,
                }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {template.questions.length} questions
                  </span>
                  <Button
                    size="sm"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectTemplate(template)
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

