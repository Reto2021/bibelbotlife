import { lazy, Suspense, type ComponentProps } from "react";
import { ClientOnly } from "@tanstack/react-router";

// Leaflet touches `window` at import time, so the map module is only loaded in the browser.
const CrossMapInner = lazy(() => import("./CrossMap"));

type Props = ComponentProps<typeof import("./CrossMap").default>;

export default function LazyCrossMap(props: Props) {
  const fallback = (
    <div className="w-full animate-pulse rounded-xl bg-muted" style={{ height: props.height ?? "70vh" }} />
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <CrossMapInner {...props} />
      </Suspense>
    </ClientOnly>
  );
}
