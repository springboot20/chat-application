import { UserType } from "./user";

export interface ChatMessageInterface {
  _id: string;
  sender: Pick<UserType, "_id" | "username" | "avatar" | "email">;
  content: string;
  attachments: Array<{
    url: string;
    localPath: string;
    _id: string;
    type?: string;
  }>;
  chat: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatListItemInterface {
  admin: string;
  createdAt: string;
  isGroupChat: boolean;
  lastMessage: ChatMessageInterface;
  name: string;
  participants: UserType[];
  updatedAt: string;
  _id: string;
}
