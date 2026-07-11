import { Tour } from "nextstepjs";
import { createSharedNavigationTour } from "./shared";
import { createChatIndexTour } from "./chatIndex";
import { createChatRoomTour } from "./chatRoom";

export interface RouteTour {
  match: (pathname: string) => boolean;
  shared: Tour[];
  page: Tour[];
}

export const createTourRegistry = (isMobile: boolean): RouteTour[] => [
  {
    match: (pathname) => pathname === "/chat",
    shared: [createSharedNavigationTour(isMobile)],
    page: [createChatIndexTour(isMobile)],
  },
  {
    match: (pathname) => /^\/chat\/[^/]+$/.test(pathname),
    shared: [createSharedNavigationTour(isMobile)],
    page: [createChatRoomTour(isMobile)],
  },
];
