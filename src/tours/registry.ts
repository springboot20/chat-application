import { Tour } from "nextstepjs";
import { sharedNavigationTour } from "./shared";
import { chatIndexTour } from "./chatIndex";
import { chatRoomTour } from "./chatRoom";

export interface RouteTour {
  match: (pathname: string) => boolean;
  shared: Tour[];
  page: Tour[];
}

export const tourRegistry: RouteTour[] = [
  {
    match: (pathname) => pathname === "/chat",
    shared: [sharedNavigationTour],
    page: [chatIndexTour],
  },
  {
    match: (pathname) => /^\/chat\/[^/]+$/.test(pathname),
    shared: [sharedNavigationTour],
    page: [chatRoomTour],
  },
];
