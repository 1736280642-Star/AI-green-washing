"use client";

import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";

type ChartEvents = Record<string, (params: unknown) => void>;

export function useEChart(option: EChartsOption, events: ChartEvents = {}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let disposed = false;
    let cleanup = () => undefined;

    void import("echarts").then((echarts) => {
      if (disposed) return;
      let chart: ReturnType<typeof echarts.init> | null = null;
      const mountChart = () => {
        if (chart || element.clientWidth === 0 || element.clientHeight === 0) return;
        chart = echarts.getInstanceByDom(element) ?? echarts.init(element, undefined, { renderer: "canvas" });
        chart.setOption(option, { notMerge: true, lazyUpdate: true });
        for (const [eventName, handler] of Object.entries(eventsRef.current)) chart.on(eventName, handler);
      };
      const observer = new ResizeObserver(() => {
        mountChart();
        chart?.resize();
      });
      observer.observe(element);
      mountChart();
      cleanup = () => {
        observer.disconnect();
        if (!chart) return;
        for (const [eventName, handler] of Object.entries(eventsRef.current)) chart.off(eventName, handler);
        chart.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [option]);

  return elementRef;
}
