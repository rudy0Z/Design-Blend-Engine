import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis,
} from "recharts";
import { AXIS_DEFS } from "@/lib/fields";
import type { AxisScores } from "@workspace/api-client-react";

export function AxisRadar({ axes, color = "hsl(var(--primary))" }: { axes: AxisScores; color?: string }) {
  const data = AXIS_DEFS.map((a) => ({
    axis: a.right,
    value: (axes as unknown as Record<string, number>)[a.key] ?? 50,
    full: 100,
  }));

  return (
    <div className="w-full aspect-square max-w-md mx-auto" data-testid="chart-axis-radar">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Taste"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
