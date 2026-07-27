"use client";

import { useCallback, useEffect, useState } from "react";

export const REST_DEFAULT_SEC = 90;

export function useRestTimer() {
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restLeft, setRestLeft] = useState(0);
  const [restDone, setRestDone] = useState(false);

  useEffect(() => {
    if (restEndsAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) {
        setRestEndsAt(null);
        setRestDone(true);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([200, 100, 200]);
        }
      }
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [restEndsAt]);

  useEffect(() => {
    if (!restDone) return;
    const t = setTimeout(() => setRestDone(false), 4000);
    return () => clearTimeout(t);
  }, [restDone]);

  const start = useCallback(() => {
    setRestDone(false);
    setRestEndsAt(Date.now() + REST_DEFAULT_SEC * 1000);
  }, []);

  const adjust = useCallback((deltaSec: number) => {
    setRestEndsAt((prev) => {
      if (prev == null) return prev;
      return Math.max(Date.now() + 1000, prev + deltaSec * 1000);
    });
  }, []);

  const skip = useCallback(() => {
    setRestEndsAt(null);
  }, []);

  return {
    secondsLeft: restLeft,
    isActive: restEndsAt != null,
    justFinished: restDone,
    start,
    adjust,
    skip,
  };
}
