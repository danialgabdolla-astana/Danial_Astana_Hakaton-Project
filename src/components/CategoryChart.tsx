"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CategoryChart({ data }: { data: { name: string; value: number }[] }) {
  const height = Math.max(220, data.length * 30);
  return (
    <div style={{ height }} className="mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#57534e" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "per month"]} cursor={{ fill: "#f5f5f4" }} />
          <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "#57534e", formatter: (v: unknown) => `$${Number(v).toLocaleString()}` }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
