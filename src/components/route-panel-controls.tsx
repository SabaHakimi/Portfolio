"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function RoutePanelControls() {
  const router = useRouter();
  const readyMarkerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      router.push("/", { scroll: false });
    };

    window.addEventListener("keydown", handleKeyDown);
    readyMarkerRef.current?.setAttribute(
      "data-route-panel-controls-ready",
      "true",
    );
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <span
      ref={readyMarkerRef}
      aria-hidden="true"
      data-route-panel-controls-ready="false"
      hidden
    />
  );
}
