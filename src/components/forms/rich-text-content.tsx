"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface RichTextContentProps {
  html?: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const [safeHtml, setSafeHtml] = useState("");

  // DOMPurify needs a browser DOM, so sanitising happens after mount to keep SSR output stable.
  useEffect(() => {
    setSafeHtml(html ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : "");
  }, [html]);

  return (
    <div
      className={cn("rich-text-content text-sm", className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
