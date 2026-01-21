import { User } from './auth';
import { UserType } from './user';

export interface ChatMessageInterface {
  _id: string;
  sender: Pick<UserType, '_id' | 'username' | 'avatar' | 'email'>;
  content: string;
  attachments: Array<{
    url: string;
    localPath: string;
    _id: string;
    type?: string;
  }>;
  replyId?: string;
  mentions: Array<{
    userId: string;
    username: string;
    position: number;
  }>;
  isDeleted: boolean;
  reactions: {
    emoji: string;
    _id: string;
    userIds: string[];
    users: {
      avatar?: { url?: string; localPath?: string; _id: string };
      _id: string;
      username: string;
    }[];
  }[];
  chat: string;
  repliedMessage: ChatMessageInterface | null;
  status: 'sent' | 'delivered' | 'seen' | 'queued';
  deliveredTo: string[]; // userIds
  seenBy: string[]; // userIds
  createdAt: string;
  updatedAt: string;
}

export interface ChatListItemInterface {
  admin: string;
  createdAt: string;
  isGroupChat: boolean;
  lastMessage: ChatMessageInterface;
  name: string;
  participants: User[];
  updatedAt: string;
  _id: string;
}
