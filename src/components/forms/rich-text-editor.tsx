"use client";

import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

type ToolbarAction = {
  key: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  canRun?: (editor: Editor) => boolean;
};

const TOOLBAR_GROUPS: ToolbarAction[][] = [
  [
    { key: "bold", icon: Bold, run: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive("bold") },
    { key: "italic", icon: Italic, run: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive("italic") },
    { key: "underline", icon: Underline, run: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive("underline") },
    { key: "strike", icon: Strikethrough, run: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive("strike") },
  ],
  [
    { key: "heading1", icon: Heading1, run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive("heading", { level: 1 }) },
    { key: "heading2", icon: Heading2, run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive("heading", { level: 2 }) },
    { key: "heading3", icon: Heading3, run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive("heading", { level: 3 }) },
  ],
  [
    { key: "bulletList", icon: List, run: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive("bulletList") },
    { key: "orderedList", icon: ListOrdered, run: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive("orderedList") },
    { key: "blockquote", icon: Quote, run: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive("blockquote") },
    { key: "divider", icon: Minus, run: (e) => e.chain().focus().setHorizontalRule().run() },
  ],
  [
    { key: "undo", icon: Undo2, run: (e) => e.chain().focus().undo().run(), canRun: (e) => e.can().undo() },
    { key: "redo", icon: Redo2, run: (e) => e.chain().focus().redo().run(), canRun: (e) => e.can().redo() },
  ],
];

const ALL_ACTIONS = TOOLBAR_GROUPS.flat();

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const t = useTranslations("forms.builder.richText.toolbar");

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false })],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      return Object.fromEntries(
        ALL_ACTIONS.map((action) => [
          action.key,
          {
            active: action.isActive?.(editor) ?? false,
            disabled: action.canRun ? !action.canRun(editor) : false,
          },
        ])
      ) as Record<string, { active: boolean; disabled: boolean }>;
    },
  });

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        {TOOLBAR_GROUPS.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={cn("flex items-center gap-0.5", groupIndex > 0 && "border-l pl-1")}
          >
            {group.map((action) => {
              const Icon = action.icon;
              const state = toolbarState?.[action.key];
              return (
                <Button
                  key={action.key}
                  type="button"
                  size="sm"
                  variant="ghost"
                  title={t(action.key as "bold")}
                  aria-label={t(action.key as "bold")}
                  aria-pressed={state?.active}
                  disabled={!editor || state?.disabled}
                  onClick={() => editor && action.run(editor)}
                  className={cn("h-8 w-8 p-0", state?.active && "bg-primary/10 text-primary")}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        ))}
      </div>
      <EditorContent editor={editor} className="rich-text-content px-3 py-2 text-sm" />
    </div>
  );
}
