"use client";

import { useEffect } from "react";

// ponytail: registration only, cache-first strategy lives in public/sw.js.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${basePath}/sw.js`);
  }, []);

  return null;
}
