"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NextStepProvider, NextStep, useNextStep } from "nextstepjs";
import type { Tour } from "nextstepjs";
import { CustomCard } from "./TourCardComponent";
import { useAppDispatch, useAppSelector } from "../../redux/redux.hooks";
import { AuthApiSlice } from "../../features/auth/auth.slice";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { createTourRegistry } from "../../tours/registry";
import { useIsMobile } from "../../hooks/useMobile";

interface TourContextType {
  restartTour: () => void;
}

export const TourContext = createContext<TourContextType>({
  restartTour: () => {},
});

// A new component to wrap the NextStep and access its hook
const NextStepWrapper: React.FC<{
  children: React.ReactNode;
  localTours: Tour[];
  setLocalTours: React.Dispatch<React.SetStateAction<Tour[]>>;
}> = ({ children, localTours, setLocalTours }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const startedTour = useRef<string>();

  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const tourRegistry = useMemo(() => createTourRegistry(isMobile), [isMobile]);

  const matchedRoute = tourRegistry.find((tour) =>
    tour.match(location.pathname),
  );
  const pendingTours = useMemo(() => {
    if (!matchedRoute) return [];

    const allTours = [...matchedRoute.shared, ...matchedRoute.page];

    return allTours.filter((tour) => !user.completedTours.includes(tour.tour));
  }, [matchedRoute, user.completedTours]);

  useEffect(() => {
    setLocalTours(pendingTours);
  }, [pendingTours, setLocalTours]);

  function waitForSelector(selector: string, callback: () => void) {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);

      if (element) {
        clearInterval(interval);
        callback();
      }
    }, 100);

    return () => clearInterval(interval);
  }

  const handleTourComplete = useCallback(
    async (tourName: string | null) => {
      try {
        if (!tourName) return;
        // Update backend when tour is completed
        const payload = {
          completedTour: tourName,
        };

        const response = await dispatch(
          AuthApiSlice.endpoints.updateAccount.initiate(payload),
        );

        if (AuthApiSlice.endpoints.updateAccount.matchFulfilled(response)) {
          toast.success("Successfully updated user app tour");
        }
      } catch (error) {
        console.error("Error updating tour status:", error);
        // Handle error appropriately - maybe show an error toast
      }
    },
    [dispatch],
  );

  // Access the hook here, inside the NextStepProvider's scope
  const { startNextStep } = useNextStep();

  useEffect(() => {
    if (!pendingTours.length) return;

    const nextTour = pendingTours[0].tour;

    if (startedTour.current === nextTour) {
      return;
    }

    startedTour.current = nextTour;

    setLocalTours(pendingTours);

    const firstSelector = pendingTours[0].steps[0].selector;
    if (!firstSelector) return;

    waitForSelector(firstSelector, () => {
      startNextStep(nextTour);
    });
  }, [pendingTours, setLocalTours, startNextStep]);

  return (
    <NextStep
      steps={localTours}
      cardComponent={(props) => <CustomCard {...props} />}
      onComplete={handleTourComplete}
    >
      <TourContext.Provider
        value={{
          restartTour() {
            const matchedRoute = tourRegistry.find((tour) =>
              tour.match(location.pathname),
            );

            if (!matchedRoute) return;

            const tours = [...matchedRoute.shared, ...matchedRoute.page];

            setLocalTours(tours);

            setTimeout(() => {
              startNextStep(tours[0].tour);
            }, 100);
          },
        }}
      >
        {children}
      </TourContext.Provider>
    </NextStep>
  );
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [localTours, setLocalTours] = useState<Tour[]>([]);

  const user = useAppSelector((state) => state.auth.user);

  const canStartTour = !!user && Array.isArray(user.completedTours);

  if (!canStartTour) {
    return <>{children}</>;
  }

  return (
    <NextStepProvider>
      <NextStepWrapper localTours={localTours} setLocalTours={setLocalTours}>
        {children}
      </NextStepWrapper>
    </NextStepProvider>
  );
};
export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
};
