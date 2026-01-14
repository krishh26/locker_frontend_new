"use client";

import React from "react";

interface EvidenceIndicatorProps {
  /** Number of evidence boxes/submissions for this unit/subunit */
  evidenceCount: number;
  /** Size variant for the indicator */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * EvidenceIndicator Component
 *
 * Displays visual indicators showing how many evidence submissions exist
 * for a unit/subunit. Shows a single box for 1 evidence, multiple boxes
 * (up to 3) plus a count for larger numbers.
 */
export const EvidenceIndicator: React.FC<EvidenceIndicatorProps> = ({
  evidenceCount,
  size = "sm",
  className = "",
}) => {
  // Don't render if no evidence
  if (evidenceCount === 0) {
    return null;
  }

  // Size variants
  const boxSize = {
    sm: "w-[10px] h-[10px]",
    md: "w-[12px] h-[12px]",
    lg: "w-[14px] h-[14px]",
  }[size];

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <div
      className={`flex items-center justify-center gap-1 mt-1 ${className}`}
    >
      {evidenceCount === 1 ? (
        <div
          className={`${boxSize} bg-blue-500 rounded-sm border border-blue-700`}
          title="1 evidence submission"
          aria-label={`${evidenceCount} evidence submission`}
        />
      ) : (
        <>
          {Array.from({ length: Math.min(evidenceCount, 3) }).map(
            (_, idx) => (
              <div
                key={idx}
                className={`${boxSize} bg-blue-500 rounded-sm border border-blue-700`}
                title={`${evidenceCount} evidence submissions`}
                aria-label={`${evidenceCount} evidence submissions`}
              />
            )
          )}
          {evidenceCount > 3 && (
            <span
              className={`${textSize} text-blue-600 font-semibold ml-1`}
              title={`${evidenceCount} total evidence submissions`}
            >
              {evidenceCount}
            </span>
          )}
        </>
      )}
    </div>
  );
};

