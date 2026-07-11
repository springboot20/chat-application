import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 1024; // lg

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const media = window.matchMedia(`(max-width:${MOBILE_BREAKPOINT - 1}px)`);

    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    setIsMobile(media.matches);

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  return isMobile;
}
