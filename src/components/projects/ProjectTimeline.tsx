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

  // Using color definitions inspired by the patch for better theming
  const activeColor = "primary-600"; // Main color for active elements (e.g., border, icon)
  const activeDotBg = "primary-50"; // Background for active dot (light variant)
  const darkActiveDotBg = "primary-900"; // Background for active dot in dark mode

  const completedColor = "primary-600"; // Main color for completed elements

  const pendingBorderColor = "gray-400";
  const pendingDotBg = "gray-200";
  const pendingTextColor = "gray-500"; // Adjusted from muted-foreground for specific pending text

  const darkPendingBorderColor = "gray-600";
  const darkPendingDotBg = "gray-800";
  const darkPendingTextColor = "gray-400";


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
      {/* ─────────────── Continuous track (behind dots) - DESKTOP ONLY ─────────────── */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 select-none hidden md:block">
        <div className="flex justify-between">
          {stages.slice(0, -1).map((stage, idx) => {
            const currentStageKey = stageKeys[idx];
            const nextStageKey = stageKeys[idx+1];
            let barBgClass = `bg-${pendingBorderColor} dark:bg-${darkPendingBorderColor} opacity-50`; // Default pending bar

            // Updated bar color logic based on patch's connector color approach
            if (statuses[currentStageKey] === 'completed' && statuses[nextStageKey] === 'completed') {
              barBgClass = `bg-${completedColor}`;
            } else if (statuses[currentStageKey] === 'completed' && statuses[nextStageKey] === 'active') {
              barBgClass = `bg-${activeColor}`; // Or completedColor, depending on desired effect up to active
            } else if (statuses[currentStageKey] === 'active') {
               barBgClass = `bg-${activeColor} opacity-50`;
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
      <div className={clsx(
        "relative z-10 flex items-start",
        "flex-col space-y-10 md:flex-row md:space-y-0 md:justify-between" // Use space-y-10 as per patch
      )}>
        {stages.map((stage, stageIndex) => { // Renamed 'i' from patch to 'stageIndex' for clarity
          const StageIcon = stage.icon; // Use StageIcon as per existing pattern
          const stageKey = stage.key as StageKey;
          const status = statuses[stageKey];
          const isLast  = stageIndex === stages.length - 1;
          
          let dotSpecificClasses = "";
          let iconSpecificClasses = "";
          let labelSpecificClasses = `text-${pendingTextColor} dark:text-${darkPendingTextColor}`;
          let connectorLineColor = `before:bg-${pendingBorderColor} dark:before:bg-${darkPendingBorderColor} before:opacity-50`;

          if (status === 'active') {
            dotSpecificClasses = `bg-${activeDotBg} border-${activeColor} dark:bg-${darkActiveDotBg} scale-105 shadow-lg`;
            iconSpecificClasses = `text-${activeColor}`;
            labelSpecificClasses = `text-${activeColor}`;
            connectorLineColor = `before:bg-${activeColor} before:opacity-50`; // Active part of connector
             // If the *next* stage is also not pending (i.e., it's current or completed), connector is solid.
            if (!isLast && statuses[stageKeys[stageIndex + 1]] !== 'pending') {
                 connectorLineColor = `before:bg-${activeColor}`;
            }

          } else if (status === 'completed') {
            dotSpecificClasses = `bg-${completedColor} border-${completedColor} text-white`;
            iconSpecificClasses = `text-white`; // Icon inside completed dot is white
            labelSpecificClasses = `text-${completedColor}`;
            connectorLineColor = `before:bg-${completedColor}`;
          } else { // Pending
            dotSpecificClasses = `bg-${pendingDotBg} border-${pendingBorderColor} dark:bg-${darkPendingDotBg} dark:border-${darkPendingBorderColor}`;
            iconSpecificClasses = `text-${pendingTextColor} dark:text-${darkPendingTextColor}`; // Icon color for pending
          }
          
          return (
            <div 
              key={stage.key} 
              className={clsx(
                "relative flex flex-col items-center text-center w-full md:w-auto"
              )}
            >
              {/* MOBILE CONNECTOR (pseudo element) */}
              {!isLast && ( // Render span only if not the last item
                <span
                  className={clsx(
                    "absolute md:hidden left-1/2 -translate-x-1/2",
                    "top-5 -z-10", // top-5 (20px) for h-10 (40px) dot, starts at center
                    "bottom-0",    // Extends to the bottom of this parent div
                    "before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2",
                    "before:top-0 before:bottom-0 before:w-1",
                    connectorLineColor // Apply the determined connector line color
                  )}
                />
              )}

              {/* Dot */}
              <span // Keeping span structure for dot as it allows separate icon styling control
                className={clsx(
                  "flex shrink-0 items-center justify-center rounded-full border-4 transition z-10", // border-4 as per patch, z-10 for dot
                  "w-10 h-10 md:w-12 md:h-12",
                  dotSpecificClasses
                )}
              >
                <StageIcon // Use StageIcon
                  className={clsx("w-5 h-5 md:w-6 md:h-6", iconSpecificClasses)}
                  strokeWidth={2}
                />
              </span>

              {/* Label */}
              <span
                className={clsx(
                  "mt-2 font-medium text-xs md:text-sm leading-tight", // leading-tight for compact labels
                  labelSpecificClasses
                )}
              >
                {stage.label}
              </span>

              {/* Date (if available) */}
              {stageDates[stage.key] && (
                <span className={clsx(
                  "mt-1 text-[11px] md:text-xs", // Adjusted text size from patch
                  `text-${pendingTextColor} dark:text-${darkPendingTextColor}` // Date text color
                  )}>
                  {format(parseISO(stageDates[stage.key] as string), "MMM d, yyyY")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 