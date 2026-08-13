export type AnalyticsRangePreset = "7d" | "30d" | "90d" | "custom";

export interface AnalyticsBreakdownRow {
  key: string;
  label: string;
  value: number;
  visitors: number;
  percentage: number;
  secondary?: string;
}

export interface AnalyticsPoint {
  date: string;
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface AnalyticsMetric {
  value: number;
  previous: number;
  change: number | null;
}

export interface AnalyticsEventPerformance {
  eventId: string;
  eventName: string;
  rank: number;
  views: number;
  uniqueViewers: number;
  sessions: number;
  percentage: number;
  previousViews: number;
  change: number | null;
}

export interface AnalyticsReport {
  range: { start: string; end: string; days: number };
  generatedAt: string;
  totals: {
    visitors: AnalyticsMetric;
    sessions: AnalyticsMetric;
    pageviews: AnalyticsMetric;
    bounceRate: AnalyticsMetric;
    avgDuration: AnalyticsMetric;
    eventViews: AnalyticsMetric;
  };
  timeseries: AnalyticsPoint[];
  sources: AnalyticsBreakdownRow[];
  countries: AnalyticsBreakdownRow[];
  devices: AnalyticsBreakdownRow[];
  browsers: AnalyticsBreakdownRow[];
  pages: AnalyticsBreakdownRow[];
  entryPages: AnalyticsBreakdownRow[];
  exitPages: AnalyticsBreakdownRow[];
  actions: AnalyticsBreakdownRow[];
  mostViewedEvents: AnalyticsEventPerformance[];
  funnel: Array<{ label: string; value: number; percentage: number }>;
  filters: { countries: string[]; sources: string[]; devices: string[] };
}
