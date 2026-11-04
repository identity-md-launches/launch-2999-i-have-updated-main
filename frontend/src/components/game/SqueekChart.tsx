import ReactECharts from "echarts-for-react";
import type { SqueekOverview } from "@/lib/progress";

/** Chart library is heavy — kept in its own lazily-loaded chunk. */
export default function SqueekChart({ overview }: { overview: SqueekOverview }) {
  const days: any[] = overview.stats?.data?.activity?.days ?? [];
  const dates = days.map((day) => String(day?.date ?? "").slice(5));
  const values = days.map((day) => Number(day?.observedWorkUnits ?? 0));
  const option = {
    grid: { left: 4, right: 4, top: 8, bottom: 0, containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
      axisLine: { lineStyle: { color: "#37305a" } },
      axisTick: { show: false },
      axisLabel: { color: "#8f88b5", fontSize: 9 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#241f33", type: "dashed" } },
      axisLabel: { color: "#8f88b5", fontSize: 9 },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#141221",
      borderColor: "#37305a",
      textStyle: { color: "#e8e5f6", fontSize: 11 },
      formatter: (params: any[]) => {
        const point = params?.[0];
        if (!point) return "";
        return `${point.name}<br/><span style="display:inline-block;width:12px;height:3px;background:#ff2882;margin-right:6px;vertical-align:middle"></span>${Number(point.value).toLocaleString("en-US")} work units`;
      },
    },
    series: [
      {
        type: "bar",
        data: values,
        itemStyle: { color: "#ff2882", borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 16,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 132 }} notMerge lazyUpdate />;
}
