import { useEffect } from "react";
import { LOCK_AFTER_MS } from "../lib/pin";

export function useInactivityLock(unlocked: boolean, lock: () => void) {
  useEffect(() => {
    if (!unlocked) return;
    let lastActivity = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      const remaining = LOCK_AFTER_MS - (Date.now() - lastActivity);
      if (remaining <= 0) lock();
      else timer = setTimeout(schedule, remaining);
    };
    const activity = () => {
      if (Date.now() - lastActivity >= LOCK_AFTER_MS) {
        lock();
        return;
      }
      lastActivity = Date.now();
      schedule();
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
    ] as const;
    for (const event of events)
      window.addEventListener(event, activity, { passive: true });
    window.addEventListener("focus", schedule);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, activity);
      window.removeEventListener("focus", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [unlocked, lock]);
}
