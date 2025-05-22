"use client";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ProjectStage } from "@/lib/types/project";

interface StageSelectProps {
  value: ProjectStage;
  onChange: (stage: ProjectStage) => void;
  disabled?: boolean;
}

const STAGES: ProjectStage[] = [
  "discovery",
  "concept-development",
  "refinement",
  "finalization",
  "delivery",
];

export function StageSelect({ value, onChange, disabled }: StageSelectProps) {
  return (
    <Select value={value} onValueChange={val => onChange(val as ProjectStage)} disabled={disabled}>
      <SelectTrigger className="w-full" />
      <SelectContent>
        {STAGES.map(s => (
          <SelectItem key={s} value={s}>
            {s.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 