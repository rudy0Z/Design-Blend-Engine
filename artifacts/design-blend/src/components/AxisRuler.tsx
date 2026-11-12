import { motion } from "framer-motion";
import { AXIS_KEYS, AXIS_META, type AxisKey, type AxisScores } from "@workspace/taste-engine";
import { cn } from "@/lib/utils";

type Props = {
  axes: AxisScores;
  coverage?: Partial<Record<AxisKey, number>>;
  compareAxes?: AxisScores;
  colorA?: string;
  colorB?: string;
  labelA?: string;
  labelB?: string;
};

/**
 * Tactile Skeuomorphic Fader Track — each taste dimension reads like a smooth
 * mixing-console fader with glowing beads instead of a technical data table.
 */
export function AxisRuler({
  axes,
  coverage,
  compareAxes,
  colorA = "#FF5A36",
  colorB = "#38BDF8",
  labelA = "You",
  labelB = "Friend",
}: Props) {
  return (
    <div className="space-y-4">
      {AXIS_KEYS.map((key) => {
        const meta = AXIS_META[key];
        const valA = axes[key] ?? 50;
        const valB = compareAxes?.[key];
        const cov = coverage?.[key] ?? 1;
        const lowSignal = cov < 0.2;

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "transition-colors",
                  valA < 44 && !lowSignal ? "text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                {meta.left}
              </span>
              <span className="text-[11px] text-muted-foreground/80">{meta.shortLabel}</span>
              <span
                className={cn(
                  "transition-colors",
                  valA > 56 && !lowSignal ? "text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                {meta.right}
              </span>
            </div>

            {/* Recessed hardware fader groove */}
            <div className="tuner-well relative h-3.5 rounded-full flex items-center px-2">
              <div className="absolute left-1/2 top-1 bottom-1 w-px bg-foreground/20" />

              {valB !== undefined && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 0.55,
                    left: `${Math.min(valA, valB)}%`,
                    width: `${Math.abs(valB - valA)}%`,
                  }}
                  style={{
                    background: `linear-gradient(90deg, ${colorA}, ${colorB})`,
                  }}
                  className="absolute h-1.5 rounded-full pointer-events-none"
                />
              )}

              {/* Fader Bead A */}
              <motion.div
                initial={false}
                animate={{ left: `${valA}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                title={`${labelA}: ${valA}`}
                style={{ backgroundColor: lowSignal ? "transparent" : colorA }}
                className={cn(
                  "absolute -translate-x-1/2 h-4 w-4 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.65)]",
                  lowSignal && "border border-muted-foreground",
                )}
              />

              {/* Fader Bead B */}
              {valB !== undefined && (
                <motion.div
                  initial={false}
                  animate={{ left: `${valB}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  title={`${labelB}: ${valB}`}
                  style={{ backgroundColor: colorB }}
                  className="absolute -translate-x-1/2 h-4 w-4 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.65)]"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
