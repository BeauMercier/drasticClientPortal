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
 * Renders a visual timeline for a project, indicating current, completed,
 * and pending stages with distinct colors and icons.
 *
 * Key visual logic:
 * - Stages before the current stage are marked 'completed' (green).
 * - The current stage is marked 'active' (blue), UNLESS it's the final
 *   'delivery' stage AND has a completion date, in which case it's 'completed' (green).
 * - Stages after the current stage are marked 'pending' (gray).
 * - Connecting bars between stages are colored based on the status of the
 *   adjacent stages (green for completed-to-completed, blue for
 *   completed-to-active, gray otherwise).
 * - Completion dates are displayed below each stage if available.
 */
export default function ProjectTimeline({
  stages,
  currentStage,
  stageDates,
}: ProjectTimelineProps) {
  console.log('[Timeline debug]', { currentStage, stageDates });

  const activeColor = "blue-500";
  const completedColor = "green-500";
  const pendingColor = "border"; // For bar background
  const pendingDotBorderColor = "border";
  const pendingDotTextColor = "muted-foreground";

  // New status calculation logic
  const stageKeys = stages.map(s => s.key) as ProjectStage[];
  type StageKey = typeof stageKeys[number];
  type StageStatus = 'completed' | 'active' | 'pending';

  const currentIdx = stageKeys.indexOf(currentStage as StageKey);
  const statuses: Record<StageKey, StageStatus> = {} as any;

  // ─── status calculation ─────────────────────────────────────────────
  // Determine the visual status of each stage based on its position
  // relative to the current stage and its completion date.
  stageKeys.forEach((key, idx) => {
    if (idx < currentIdx) {
      // Stages before the current active stage are considered completed.
      statuses[key] = 'completed';
      return;
    }

    if (idx === currentIdx) {
      // The current stage is generally 'active' (blue).
      let status: StageStatus = 'active';

      // Exception: If the current stage is 'delivery' (the final stage)
      // AND it has a recorded completion date, it's shown as 'completed' (green).
      // This allows the timeline to look fully completed once delivery is done.
      if (key === 'delivery' && stageDates.delivery) {
        status = 'completed';
      }

      statuses[key] = status;
      return;
    }

    // Stages after the current active stage are considered pending.
    statuses[key] = 'pending';
  });

  return (
    <div className="relative w-full">
      {/* ─────────────── Continuous track (behind dots) ─────────────── */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 select-none">
        <div className="flex justify-between">
          {stages.slice(0, -1).map((stage, idx) => {
            const currentStageKey = stageKeys[idx];
            const nextStageKey = stageKeys[idx+1];
            let barBgClass = `bg-${pendingColor}`;

            // Updated bar color logic
            if (statuses[currentStageKey] === 'completed' && statuses[nextStageKey] === 'completed') {
              barBgClass = `bg-${completedColor}`;
            } else if (statuses[currentStageKey] === 'completed' && statuses[nextStageKey] === 'active') {
              barBgClass = `bg-${activeColor}`;
            }

            return (
              <div
                key={`bar-${idx}`}
                className={clsx("h-1 flex-1", barBgClass)}
              />
            );
          })}
        </div>
      </div>

      {/* ─────────────── Dots, labels & dates ─────────────── */}
      <div className="relative z-10 flex justify-between items-start">
        {stages.map((stage) => {
          const DotIcon = stage.icon;
          const stageKey = stage.key as StageKey;
          
          // Updated dot, icon, and label color logic
          let dotClasses = `bg-background border-${pendingDotBorderColor} text-${pendingDotTextColor}`;
          let iconClasses = `text-${pendingDotTextColor}`;
          let labelClasses = `text-${pendingDotTextColor}`;

          const status = statuses[stageKey];

          if (status === 'active') {
            dotClasses = `shadow-lg bg-${activeColor} border-${activeColor} text-white scale-110`;
            iconClasses = `text-white`;
            labelClasses = `text-${activeColor}`;
          } else if (status === 'completed') {
            dotClasses = `bg-${completedColor} border-${completedColor} text-white`;
            iconClasses = `text-white`;
            labelClasses = `text-${completedColor}`;
          }

          return (
            <div key={stage.key} className="flex flex-col items-center text-center">
              {/* Dot */}
              <span
                className={clsx(
                  "flex shrink-0 items-center justify-center rounded-full border-2 transition",
                  "w-10 h-10 md:w-12 md:h-12",
                  dotClasses
                )}
              >
                <DotIcon
                  className={clsx("w-5 h-5 md:w-6 md:h-6", iconClasses)}
                  strokeWidth={2}
                />
              </span>

              {/* Label */}
              <span
                className={clsx(
                  "mt-2 font-medium text-xs md:text-sm leading-none",
                  labelClasses
                )}
              >
                {stage.label}
              </span>

              {/* Date (if available) */}
              {stageDates[stage.key] && (
                <span className="mt-1 text-xs text-muted-foreground">
                  {format(parseISO(stageDates[stage.key] as string), "MMM d, yyyy")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 