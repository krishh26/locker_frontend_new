"use client";

import React from "react";

interface GapIndicatorProps {
  /** Whether learner map is checked */
  learnerMap: boolean;
  /** Whether trainer map is checked */
  trainerMap: boolean;
  /** Whether signed off is checked */
  signedOff: boolean;
  /** Whether the indicator is clickable */
  onClick?: () => void;
  /** Whether the indicator is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * GapIndicator Component
 *
 * Displays a colored box indicating the mapping status:
 * - Green: learnerMap && trainerMap && signedOff
 * - Orange: learnerMap && trainerMap (but not signedOff)
 * - Empty/Gray: otherwise
 */
export const GapIndicator: React.FC<GapIndicatorProps> = ({
  learnerMap,
  trainerMap,
  signedOff,
  onClick,
  disabled = false,
  className = "",
}) => {
  const isClickable = !disabled && learnerMap && onClick;
  const backgroundColor =
    learnerMap && trainerMap && signedOff
      ? "bg-accent"
      : learnerMap && trainerMap
      ? "bg-secondary"
      : "";

  return (
    <div
      className={`border-2 border-muted-foreground w-4 h-4 mt-3 p-px flex items-center justify-center ${className}`}
      style={{
        cursor: isClickable ? "pointer" : "default",
        opacity: isClickable ? 1 : 0.8,
      }}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={
        learnerMap && trainerMap && signedOff
          ? "Fully mapped and signed off"
          : learnerMap && trainerMap
          ? "Mapped by learner and trainer"
          : learnerMap
          ? "Mapped by learner"
          : "Not mapped"
      }
    >
      <div className={`w-full h-full ${backgroundColor}`} />
    </div>
  );
};

