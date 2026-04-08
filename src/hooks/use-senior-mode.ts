import { useState, useEffect } from "react";

const STORAGE_KEY = "bibelbot-senior-mode";

function getInitial(): boolean {
  try {
    // URL parameter takes priority
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "senior") {
      localStorage.setItem(STORAGE_KEY, "1");
      return true;
    }
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useSeniorMode() {
  const [isSenior, setIsSenior] = useState(getInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isSenior ? "1" : "0");
    } catch {}
  }, [isSenior]);

  const toggle = () => setIsSenior((prev) => !prev);

  return { isSenior, toggle };
}
