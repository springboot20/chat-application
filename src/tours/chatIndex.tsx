import { Tour } from "nextstepjs";

export const createChatIndexTour = (isMobile: boolean): Tour => {
  console.log({ isMobile });
  return {
    tour: "chat-index",

    steps: [
      {
        icon: (
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-[#615EF0]/10 text-[#615EF0]">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 2H7C4.24 2 2 4.23 2 6.98V13.96C2 16.71 4.24 18.94 7 18.94H8.5C8.77 18.94 9.13 19.12 9.3 19.34L10.8 21.33C11.46 22.21 12.54 22.21 13.2 21.33L14.7 19.34C14.89 19.09 15.19 18.94 15.5 18.94H17C19.76 18.94 22 16.71 22 13.96V6.98C22 4.23 19.76 2 17 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
        ),

        title: "Main Workspace",

        selector: "#chat-index",

        content: (
          <>
            This is the main workspace of the application. The content shown
            here changes based on what you select from the navigation. When you
            open
            <strong> Chats</strong>, you'll see your conversations and recent
            messages. When you switch to <strong>Status</strong>, this area
            displays the latest updates shared by your contacts. As new features
            are added, they'll also appear here, making this the central place
            where you interact with the application.
          </>
        ),

        pointerPadding: 10,
        pointerRadius: 8,
      },
    ],
  };
};
