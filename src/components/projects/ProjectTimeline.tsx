'use client';

import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { format, parseISO } from "date-fns";

import { ProjectStage } from "@/lib/types/project";

/**
 * Configuration object describing a single stage in the timeline.
 */
export interface StageConfig {
  /** Matching enum key in `ProjectStage` */
  key: ProjectStage;
  /** Human-readable label displayed under the dot */
  label: string;
  /** Lucide icon shown inside the dot */
  icon: LucideIcon;
}

export interface ProjectTimelineProps {
  /** Ordered list of stages for this project type */
  stages: StageConfig[];
  /** The stage currently in progress */
  currentStage: ProjectStage | null;
  /** Map of stage → ISO date string when that stage was completed */
  stageDates: Record<ProjectStage, string | null>;
}

/**
 * Pixel-perfect recreation of the original inline timeline used on the
 * web-design project page.  Responsive sizing (mobile ≤ md & desktop ≥ md)
 * and the two-layer layout (continuous track behind the dots) have been
 * preserved so the visual output is identical.
 */
export default function ProjectTimeline({
  stages,
  currentStage,
  stageDates,
}: ProjectTimelineProps) {
  // Index of the current stage in the ordered stages array. –1 ⇒ none yet.
  const currentIdx = currentStage
    ? stages.findIndex((s) => s.key === currentStage)
    : -1;

  return (
    <div className="relative w-full">
      {/* ─────────────── Continuous track (behind dots) ─────────────── */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 select-none">
        <div className="flex justify-between">
          {stages.slice(0, -1).map((stage, idx) => (
            <div
              key={stage.key}
              className={clsx(
                "h-1 flex-1",
                idx < currentIdx ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* ─────────────── Dots, labels & dates ─────────────── */}
      <div className="relative z-10 flex justify-between items-start">
        {stages.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const DotIcon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center text-center">
              {/* Dot */}
              <span
                className={clsx(
                  "flex shrink-0 items-center justify-center rounded-full border-2 transition",
                  "w-10 h-10 md:w-12 md:h-12",
                  isDone &&
                    "bg-primary border-primary text-primary-foreground",
                  isActive &&
                    "shadow-lg bg-background border-primary text-primary scale-110",
                  !isDone &&
                    !isActive &&
                    "bg-background border-border text-muted-foreground"
                )}
              >
                <DotIcon
                  className={clsx(
                    "w-5 h-5 md:w-6 md:h-6",
                    isActive && "text-primary",
                    isDone && "text-primary-foreground"
                  )}
                  strokeWidth={2}
                />
              </span>

              {/* Label */}
              <span
                className={clsx(
                  "mt-2 font-medium text-xs md:text-sm leading-none",
                  isDone || isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>

              {/* Date (if available) */}
              {stageDates[stage.key] && (
                <span className="mt-1 text-xs text-muted-foreground">
                  {format(
                    parseISO(stageDates[stage.key] as string),
                    "MMM d, yyyy"
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 