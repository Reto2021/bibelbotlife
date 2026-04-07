import { useAnalytics } from "@/hooks/useAnalytics";
import { createContext, useContext } from "react";

type AnalyticsContext = {
  track: (eventName: string, eventData?: Record<string, unknown>) => Promise<void>;
};

const AnalyticsCtx = createContext<AnalyticsContext>({ track: async () => {} });

export const useTrack = () => useContext(AnalyticsCtx);

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const analytics = useAnalytics();
  return <AnalyticsCtx.Provider value={analytics}>{children}</AnalyticsCtx.Provider>;
};
