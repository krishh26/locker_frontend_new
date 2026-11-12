"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { useTemplateResolver } from "./template-variables";

type PresetValues = Record<string, string | number | null | undefined>;

interface RichTextContentProps {
  html?: string;
  className?: string;
  /** Preset values for `{variable}` tokens; tokens without a value show as `[Label]`. */
  values?: PresetValues;
}

export function RichTextContent({ html, className, values }: RichTextContentProps) {
  const [safeHtml, setSafeHtml] = useState("");
  const resolveTemplate = useTemplateResolver();

  // DOMPurify needs a browser DOM, so sanitising happens after mount to keep SSR output stable.
  useEffect(() => {
    setSafeHtml(
      html
        ? DOMPurify.sanitize(resolveTemplate(html, values, true), {
            USE_PROFILES: { html: true },
            ADD_ATTR: ["target"],
          })
        : ""
    );
  }, [html, values, resolveTemplate]);

  return (
    <div
      className={cn("rich-text-content text-sm", className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
