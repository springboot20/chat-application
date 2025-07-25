import { useCallback, useEffect, useMemo, useState } from "react";

export const useNetwork = () => {
  const [isOnline, setIsOnline] = useState<boolean>((): boolean => {
    return navigator.onLine;
  });

  const setOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const setOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, [setOffline, setOnline]);

  return useMemo(
    () => ({
      isOnline,
    }),
    [isOnline]
  );
};
