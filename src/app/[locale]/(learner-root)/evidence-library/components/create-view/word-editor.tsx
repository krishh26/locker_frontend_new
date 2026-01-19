"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WordEditorProps {
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
  wordContent: string;
  setWordContent: (content: string) => void;
  onSaveUpload: () => void;
  loading: boolean;
  disabled: boolean;
}

export function WordEditor({
  documentTitle,
  setDocumentTitle,
  wordContent,
  setWordContent,
  onSaveUpload,
  loading,
  disabled,
}: WordEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Execute formatting command
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
    updateFormatStates();
  };

  // Update content from contentEditable div
  const updateContent = () => {
    if (editorRef.current) {
      setWordContent(editorRef.current.innerHTML);
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

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && wordContent && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = wordContent;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Document Title */}
      <div className="space-y-2">
        <Label htmlFor="document-title">
          Document Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="document-title"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          placeholder="Enter document title"
          disabled={disabled || loading}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50 flex-wrap">
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
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("justifyLeft")}
          disabled={disabled || loading}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("justifyCenter")}
          disabled={disabled || loading}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("justifyRight")}
          disabled={disabled || loading}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertUnorderedList")}
          disabled={disabled || loading}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("insertOrderedList")}
          disabled={disabled || loading}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        <div
          ref={editorRef}
          contentEditable={!disabled && !loading}
          onInput={updateContent}
          onBlur={updateContent}
          className={cn(
            "flex-1 border rounded-lg p-4 overflow-auto",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "prose prose-sm max-w-none",
            disabled && "bg-muted cursor-not-allowed"
          )}
          style={{
            minHeight: "400px",
          }}
          suppressContentEditableWarning
        >
          {!wordContent && (
            <p className="text-muted-foreground">
              Start typing your document content...
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onSaveUpload}
          disabled={disabled || loading || !documentTitle.trim() || !wordContent.trim()}
        >
          {loading ? "Creating..." : "Create Document"}
        </Button>
      </div>
    </div>
  );
}

