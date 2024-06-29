import { UserType } from './user.type';

export type ChatMessageType = {
  _id: string;
  sender: Pick<UserType, '_id' | 'username' | 'avatar' | 'email'>;
  content: string;
  attachments: Array<{
    url: string;
    localPath: string;
    _id: string;
  }>;
  chat: string;
  createdAt: string;
  updatedAt: string;
};
