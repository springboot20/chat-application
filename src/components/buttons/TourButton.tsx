"use client";

import React from "react";
import { useTour } from "../../context/touring/TourContext";
import type { Tour } from "nextstepjs";

interface Props {
  steps: Tour[];
  tourId?: string;
  children?: React.ReactNode;
}

export default function StartTourButton({ steps, tourId, children }: Props) {
  const { startTour } = useTour();

  console.log(tourId);

  const handleStart = () => {
    startTour(steps);
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      className="px-3 py-2 bg-colorB35 w-42 text-white rounded-md text-sm"
    >
      {children ?? "Start Tour"}
    </button>
  );
}
