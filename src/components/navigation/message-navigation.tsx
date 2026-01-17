import React, { Fragment } from 'react';
import { MessageTabComponent } from './MessageTab';

type Tab = 'status' | 'chat_messages' | 'settings';

type MessageNavigationProps = {
  setActiveTab?: React.Dispatch<React.SetStateAction<Tab>>;
  activeTab: Tab;
  open: boolean;
  close: () => any;
};

export const MessageNavigation: React.FC<MessageNavigationProps> = ({ open, close, activeTab }) => {
  console.log(open);
  return (
    activeTab === 'chat_messages' && (
      <Fragment>
        <MessageTabComponent open={open} close={close} />
      </Fragment>
    )
  );
};
