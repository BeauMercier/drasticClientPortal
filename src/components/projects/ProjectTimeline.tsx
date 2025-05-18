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

// Type for the visual properties derived from a stage's status
interface StageVisualProperties {
  dotBg: string;
  dotBr: string;
  icon: string;
  label: string;
  bar: string;
}

/**
 * Renders a visual timeline for a project, indicating current, completed,
 * and pending stages with distinct colors and icons, based on a precise specification.
 *
 * Visual Rules:
 * - Each dot (stage) has one of three statuses: completed (GREEN), current/active (BLUE), or pending (GRAY).
 * - Each connecting bar segment belongs to the dot at its left/upper end and inherits that dot's color for its full length.
 * - Example Flow: [completed-dot]─green─[completed]─green─…─[active]─blue─[pending]─gray─[pending]─gray
 *
 * Status Algorithm:
 * - A stage is 'completed' if its index is before the current stage's index.
 * - A stage is 'active' if its index matches the current stage's index.
 * - A stage is 'pending' if its index is after the current stage's index.
 * - Special Case: If the *last* stage is 'active' AND has a completion date, it's treated as 'completed' (all-green timeline).
 * - If `currentStageKey` is not found, all stages default to 'pending'.
 *
 * Color Palette (example, see `getVisualProperties` for exact Tailwind classes):
 * - Completed: green-600 / dark:green-500 (dot, label, bar); text-white (icon).
 * - Active: blue-600 / dark:blue-500 (dot border, icon, label, bar); bg-blue-50 (dot bg).
 * - Pending: gray-400 / dark:gray-600 (dot border, bar with opacity); bg-gray-200 (dot bg); text-gray-500 (icon, label).
 *
 * Layout:
 * - Desktop (>=md): Interleaved [DOT_GROUP] ---bar--- [DOT_GROUP] layout, dots vertically centered with bars.
 * - Mobile (<md): Stacked dot groups with vertical connectors.
 */
export default function ProjectTimeline({
  stages,
  currentStage,
  stageDates,
}: ProjectTimelineProps) {
  console.log('[Timeline debug]', { currentStage, stageDates });

  const stageKeys = stages.map(s => s.key);
  type StageStatus = 'completed' | 'active' | 'pending';

  const currentIdx = currentStage ? stageKeys.indexOf(currentStage) : -1;
  
  // Edge case: If currentStageKey is not found, treat all as pending
  if (currentIdx === -1 && stages.length > 0) { // Only if there are stages to show
    console.warn(`[Timeline] currentStageKey '${currentStage}' not found in stages. Defaulting all to pending.`);
    // No need to set currentIdx to something specific if all are pending by default in status calculation below
  }

  const statuses: Record<ProjectStage, StageStatus> = {} as any;

  stageKeys.forEach((key, idx) => {
    if (currentIdx === -1) { // If currentStageKey not found, all are pending
      statuses[key] = 'pending';
      return;
    }
    if (idx < currentIdx) {
      statuses[key] = 'completed';
    } else if (idx === currentIdx) {
      // Special case: If the very last stage is current AND has a date, treat as completed
      if (key === stages[stages.length - 1].key && stageDates[key]) {
        statuses[key] = 'completed';
      } else {
        statuses[key] = 'active';
      }
    } else {
      statuses[key] = 'pending';
    }
  });
  
  // D. Colour palette & E. Mapping status → tailwind classes (combined)
  const getVisualProperties = (status: StageStatus): StageVisualProperties => {
    switch (status) {
      case 'completed':
        return {
          dotBg: 'bg-green-600 dark:bg-green-500',
          dotBr: 'border-green-600 dark:border-green-500',
          icon: 'text-white',
          label: 'text-green-600 dark:text-green-500',
          bar: 'bg-green-600 dark:bg-green-500' // 100% opacity implied
        };
      case 'active':
        return {
          dotBg: 'bg-blue-50 dark:bg-opacity-10 dark:bg-blue-400', // Adjusted dark for blue-50 equivalent
          dotBr: 'border-blue-600 dark:border-blue-500',
          icon: 'text-blue-600 dark:text-blue-500',
          label: 'text-blue-600 dark:text-blue-500',
          bar: 'bg-blue-600 dark:bg-blue-500' // 100% opacity implied
        };
      case 'pending':
      default:
        return {
          dotBg: 'bg-gray-200 dark:bg-gray-700', // Adjusted from spec for better dark bg
          dotBr: 'border-gray-400 dark:border-gray-600',
          icon: 'text-gray-500 dark:text-gray-400',
          label: 'text-gray-500 dark:text-gray-400',
          bar: 'bg-gray-400 dark:bg-gray-600 opacity-50' // 50% opacity as per spec
        };
    }
  };

  if (!stages || stages.length === 0) {
    return null; // Or some placeholder if no stages
  }

  return (
    <div className="w-full">
      {/* Mobile Layout (screens < md) */}
      <div className="md:hidden flex flex-col items-center space-y-2"> {/* Added space-y for mobile items */}
        {stages.map((stage, idx) => {
          const StageIcon = stage.icon;
          const status = statuses[stage.key];
          const visualProps = getVisualProperties(status);
          const isLast = idx === stages.length - 1;

          return (
            <React.Fragment key={stage.key + '-mobile'}>
              <div className="flex flex-col items-center text-center">
                {/* Dot */}
                <span
                  className={clsx(
                    "flex shrink-0 items-center justify-center rounded-full border-2 transition z-10",
                    "w-10 h-10", // Mobile specific size for dot
                    visualProps.dotBg, visualProps.dotBr
                  )}
                >
                  <StageIcon
                    className={clsx("w-5 h-5", visualProps.icon)} // Mobile specific size for icon
                    strokeWidth={2}
                  />
                </span>
                {/* Label */}
                <span className={clsx("mt-2 font-medium text-xs leading-tight", visualProps.label)}>
                  {stage.label}
                </span>
                {/* Date */}
                {stageDates[stage.key] && (
                  <span className={clsx("mt-1 text-[11px]", getVisualProperties('pending').label)}>
                    {format(parseISO(stageDates[stage.key] as string), "MMM d, yyyy")}
                  </span>
                )}
              </div>
              {/* Vertical Connector Line (Mobile) */}
              {!isLast && (
                <div className={clsx("w-0.5 h-8 my-1", visualProps.bar)} /> // my-1 for spacing, h-8 for length
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Desktop Layout (screens >= md) */}
      <div className="hidden md:flex items-center justify-between w-full">
        {stages.map((stage, idx) => {
          const StageIcon = stage.icon;
          const status = statuses[stage.key];
          const visualProps = getVisualProperties(status);
          const isLast = idx === stages.length - 1;

          return (
            <React.Fragment key={stage.key + '-desktop'}>
              <div className="flex flex-col items-center text-center px-1"> {/* px-1 for some spacing of stage content*/}
                {/* Dot */}
                <span
                  className={clsx(
                    "flex shrink-0 items-center justify-center rounded-full border-2 transition z-10",
                    "w-12 h-12", // Desktop specific size for dot
                    visualProps.dotBg, visualProps.dotBr
                  )}
                >
                  <StageIcon
                    className={clsx("w-6 h-6", visualProps.icon)} // Desktop specific size for icon
                    strokeWidth={2}
                  />
                </span>
                {/* Label */}
                <span className={clsx("mt-2 font-medium text-sm leading-tight", visualProps.label)}>
                  {stage.label}
                </span>
                {/* Date */}
                {stageDates[stage.key] && (
                  <span className={clsx("mt-1 text-xs", getVisualProperties('pending').label)}>
                    {format(parseISO(stageDates[stage.key] as string), "MMM d, yyyy")}
                  </span>
                )}
              </div>
              {/* Horizontal Bar (Desktop) */}
              {!isLast && (
                 // flex-1 will make bar take up space. mx-2 provides space around the bar itself.
                <div className={clsx("flex-1 h-1 mx-1", visualProps.bar)} /> 
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
} 