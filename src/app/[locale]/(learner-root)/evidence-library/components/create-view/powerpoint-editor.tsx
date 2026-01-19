"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Bold, Italic, Underline } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Slide {
  id: string;
  title: string;
  content: string;
}

interface PowerPointEditorProps {
  presentationTitle: string;
  setPresentationTitle: (title: string) => void;
  slides: Slide[];
  setSlides: (slides: Slide[]) => void;
  onSaveUpload: () => void;
  loading: boolean;
  disabled: boolean;
}

export function PowerPointEditor({
  presentationTitle,
  setPresentationTitle,
  slides,
  setSlides,
  onSaveUpload,
  loading,
  disabled,
}: PowerPointEditorProps) {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const contentEditorRef = useRef<HTMLDivElement>(null);

  const selectedSlide = slides[selectedSlideIndex];

  // Execute formatting command
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateSlideContent();
    updateFormatStates();
  };

  // Update slide content from contentEditable div
  const updateSlideContent = () => {
    if (contentEditorRef.current && selectedSlide) {
      const newSlides = [...slides];
      newSlides[selectedSlideIndex].content = contentEditorRef.current.innerHTML;
      setSlides(newSlides);
    }
  };

  // Update button states based on current selection
  const updateFormatStates = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
  };

  // Handle selection change to update button states
  useEffect(() => {
    const handleSelectionChange = () => {
      updateFormatStates();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Update editor content when slide changes
  useEffect(() => {
    if (contentEditorRef.current && selectedSlide) {
      contentEditorRef.current.innerHTML = selectedSlide.content || "";
    }
  }, [selectedSlideIndex, selectedSlide]);

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: `Slide ${slides.length + 1}`,
      content: "Enter your content here...",
    };
    setSlides([...slides, newSlide]);
    setSelectedSlideIndex(slides.length);
  };

  const deleteSlide = (id: string) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((slide) => slide.id !== id);
      setSlides(newSlides);
      if (selectedSlideIndex >= newSlides.length) {
        setSelectedSlideIndex(newSlides.length - 1);
      }
    }
  };

  const updateSlideTitle = (id: string, title: string) => {
    setSlides(
      slides.map((slide) => (slide.id === id ? { ...slide, title } : slide))
    );
  };

  // Validate all slides have title and content
  const isValid =
    presentationTitle.trim() &&
    slides.every(
      (slide) => slide.title.trim() && slide.content.trim() !== ""
    );

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Presentation Title */}
      <div className="space-y-2">
        <Label htmlFor="presentation-title">
          Presentation Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="presentation-title"
          value={presentationTitle}
          onChange={(e) => setPresentationTitle(e.target.value)}
          placeholder="Enter presentation title"
          disabled={disabled || loading}
        />
      </div>

      <div className="flex-1 flex gap-4 min-h-[500px]">
        {/* Slide List */}
        <div className="w-64 border rounded-lg flex flex-col">
          <div className="p-3 border-b bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Slides</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSlide}
                disabled={disabled || loading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedSlideIndex === index
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => setSelectedSlideIndex(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium mb-1">
                        Slide {index + 1}
                      </div>
                      <div className="text-sm truncate">{slide.title}</div>
                    </div>
                    {slides.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slide.id);
                        }}
                        disabled={disabled || loading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 flex flex-col border rounded-lg">
          {selectedSlide && (
            <>
              {/* Toolbar */}
              <div className="p-3 border-b bg-muted/50 flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("bold")}
                  disabled={disabled || loading}
                  className={cn(isBold && "bg-accent")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("italic")}
                  disabled={disabled || loading}
                  className={cn(isItalic && "bg-accent")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand("underline")}
                  disabled={disabled || loading}
                  className={cn(isUnderline && "bg-accent")}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>

              {/* Slide Content */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="mb-4">
                  <Label>Slide Title</Label>
                  <Input
                    value={selectedSlide.title}
                    onChange={(e) =>
                      updateSlideTitle(selectedSlide.id, e.target.value)
                    }
                    disabled={disabled || loading}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <Label>Slide Content</Label>
                  <div
                    ref={contentEditorRef}
                    contentEditable={!disabled && !loading}
                    onInput={updateSlideContent}
                    onBlur={updateSlideContent}
                    className={cn(
                      "flex-1 border rounded-lg p-4 overflow-auto mt-2",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "prose prose-sm max-w-none",
                      disabled && "bg-muted cursor-not-allowed"
                    )}
                    style={{ minHeight: "300px" }}
                    suppressContentEditableWarning
                  >
                    {!selectedSlide.content && (
                      <p className="text-muted-foreground">
                        Enter your slide content...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSaveUpload}
          disabled={disabled || loading || !isValid}
        >
          {loading ? "Creating..." : "Create Presentation"}
        </Button>
      </div>
    </div>
  );
}

