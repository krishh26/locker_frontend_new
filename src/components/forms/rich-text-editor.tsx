"use client";

import { useState } from "react";
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
  Link2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { VariableMenu } from "./variable-menu";

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

const normalizeUrl = (raw: string): string => {
  const url = raw.trim();
  if (!url) return "";
  return /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
};

interface LinkButtonProps {
  editor: Editor | null;
  active: boolean;
}

function LinkButton({ editor, active }: LinkButtonProps) {
  const t = useTranslations("forms.builder.richText.toolbar");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next && editor) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    }
    setOpen(next);
  };

  const applyLink = () => {
    if (!editor) return;
    const href = normalizeUrl(url);
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: insert the URL itself as the link text.
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: url.trim(), marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setOpen(false);
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          title={t("link")}
          aria-label={t("link")}
          aria-pressed={active}
          disabled={!editor}
          className={cn("h-8 w-8 p-0", active && "bg-primary/10 text-primary")}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 p-3">
        <Input
          autoFocus
          value={url}
          placeholder={t("linkPlaceholder")}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyLink();
            }
          }}
          className="h-8"
        />
        <div className="flex justify-end gap-2">
          {active && (
            <Button type="button" size="sm" variant="outline" onClick={removeLink}>
              {t("unlink")}
            </Button>
          )}
          <Button type="button" size="sm" onClick={applyLink}>
            {t("applyLink")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const t = useTranslations("forms.builder.richText.toolbar");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
    ],
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

  const linkActive = useEditorState({
    editor,
    selector: ({ editor }) => editor?.isActive("link") ?? false,
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
        <div className="flex items-center gap-0.5 border-l pl-1">
          <LinkButton editor={editor} active={linkActive ?? false} />
          <VariableMenu
            compact
            disabled={!editor}
            onInsert={(token) => editor?.chain().focus().insertContent(token).run()}
          />
        </div>
      </div>
      <EditorContent editor={editor} className="rich-text-content px-3 py-2 text-sm" />
    </div>
  );
}
