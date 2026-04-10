import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Defensive shim for environments/extensions that clobber Performance methods.
if (typeof window !== "undefined" && typeof window.performance !== "undefined") {
  const perf = window.performance as Performance & {
    clearMarks?: (name?: string) => void;
    clearMeasures?: (name?: string) => void;
    mark?: (name: string, options?: PerformanceMarkOptions) => PerformanceMark;
    measure?: (
      measureName: string,
      startOrMeasureOptions?: string | PerformanceMeasureOptions,
      endMark?: string,
    ) => PerformanceMeasure;
  };

  if (typeof perf.clearMarks !== "function") perf.clearMarks = () => {};
  if (typeof perf.clearMeasures !== "function") perf.clearMeasures = () => {};
  if (typeof perf.mark !== "function") perf.mark = () => ({ name: "", entryType: "mark", startTime: 0, duration: 0 } as PerformanceMark);
  if (typeof perf.measure !== "function") perf.measure = () => ({ name: "", entryType: "measure", startTime: 0, duration: 0 } as PerformanceMeasure);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
