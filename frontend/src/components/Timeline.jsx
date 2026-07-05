/**
 * components/Timeline.jsx
 * -------------------------
 * Clusters ko time-axis pe plot karta hai. Har cluster ek horizontal bar
 * ki tarah dikhta hai jo uske earliest se latest article tak span karta hai.
 *
 * recharts ka BarChart use kar rahe hain with a custom trick: hum
 * "start" timestamp ko invisible base bana dete hain aur "duration"
 * (end - start) ko visible bar bana dete hain - isse ek Gantt-chart
 * jaisa effect ban jaata hai (yeh common recharts pattern hai timeline
 * ke liye kyunki recharts mein native Gantt/timeline chart type nahi hai).
 */

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function toEpoch(isoString) {
  return new Date(isoString).getTime();
}

export default function Timeline({ clusters, onSelectCluster }) {
  if (!clusters || clusters.length === 0) {
    return (
      <p className="empty-state">No clusters found. Try refreshing the data.</p>
    );
  }

  const maxIntensity = Math.max(...clusters.map((c) => c.intensity || 1));

  // Chart data prepare karo: base = invisible offset, duration = visible bar width
  const chartData = clusters.map((c) => {
    const startEpoch = toEpoch(c.start);
    const endEpoch = toEpoch(c.end);
    return {
      ...c,
      base: startEpoch,
      duration: Math.max(endEpoch - startEpoch, 1000 * 60 * 30), // min 30-min width taaki single-article clusters bhi dikhein
    };
  });

  // BUG FIX: XAxis domain="dataMin"/"dataMax" recharts mein stacked bars ke
  // saare dataKeys (base + duration) ko mila ke compute hota hai - isse
  // "duration" ke chhote values (jaise 30 min = ~1.8e6 ms) domain ka min
  // ban jaate the, jabki humein sirf actual date-range chahiye tha
  // (isi wajah se X-axis 1/1/1970 se shuru ho raha tha). Ab explicitly
  // sirf real start/end epochs se hi domain nikaal rahe hain.
  const allEpochs = chartData.flatMap((c) => [c.base, c.base + c.duration]);
  const domainMin = Math.min(...allEpochs);
  const domainMax = Math.max(...allEpochs);
  const padding = (domainMax - domainMin) * 0.05 || 1000 * 60 * 60 * 24; // 5% padding, ya 1 din agar sab same time ho

  return (
    <div className="timeline-wrapper">
      <ResponsiveContainer
        width="100%"
        height={Math.max(chartData.length * 50, 200)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[domainMin - padding, domainMax + padding]}
            tickFormatter={(t) => new Date(t).toLocaleDateString()}
          />
          <YAxis type="category" dataKey="label" width={150} />
          <Tooltip
            labelFormatter={(label) => label}
            formatter={(value, name, props) => {
              if (name === "duration") {
                return [
                  `${props.payload.articleCount} articles`,
                  "Article count",
                ];
              }
              return [value, name];
            }}
          />
          {/* Invisible "base" bar - pushes the visible bar to the right start point */}
          <Bar dataKey="base" stackId="a" fill="transparent" />
          {/* Visible bar - size grows with cluster's article count (bigger cluster = bolder marker) */}
          <Bar
            dataKey="duration"
            stackId="a"
            radius={[4, 4, 4, 4]}
            onClick={(data) => onSelectCluster(data.id)}
            cursor="pointer"
          >
            {chartData.map((entry, index) => {
              // Bada cluster (zyada articles) = zyada bold color - stretch goal:
              // "visual cluster sizing" ka simple version, chart height fixed
              // rakh ke color-intensity se size communicate kar rahe hain
              const opacity = 0.4 + 0.6 * (entry.intensity / maxIntensity);
              return (
                <Cell key={index} fill={`rgba(37, 99, 235, ${opacity})`} />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
