import { User } from './auth';
import { UserType } from './user';

export interface Attachment {
  _id?: string;
  url: string;
  localPath?: string;
  fileType?: 'image' | 'document' | 'video' | 'voice';
  fileName?: string;
  fileSize?: number;
  duration?: number; // for voice messages
  waveform?: number[]; // waveform data
}

export interface PollingVoteInterface {
  questionTitle: string;
  options: Array<{
    _id: string;
    optionValue: string;
    responses: Array<User>;
  }>;
  allowMultipleAnswer: boolean;
}

type MentionType = Array<{
  userId: string;
  username: string;
  position: number;
}>;

type ReactionType = {
  emoji: string;
  _id: string;
  userIds: string[];
  users: {
    avatar?: { url?: string; localPath?: string; _id: string };
    _id: string;
    username: string;
  }[];
};

export interface ChatMessageInterface {
  _id: string;
  sender: Pick<UserType, '_id' | 'username' | 'avatar' | 'email'>;
  content: string;
  contentType: 'text-file' | 'polling' | 'contact';
  polling: PollingVoteInterface;
  attachments: Array<Attachment>;
  replyId?: string;
  mentions: MentionType;
  isDeleted: boolean;
  reactions: ReactionType[];
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
