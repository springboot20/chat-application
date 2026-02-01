import React, { Fragment } from 'react';
import { MessageTabComponent } from './MessageTab';
import { StatusTabComponent } from './StatusTab';

type Tab = 'status' | 'chat_messages' | 'settings';

type NavigationProps = {
  setActiveTab?: React.Dispatch<React.SetStateAction<Tab>>;
  activeTab: Tab;
  open: boolean;
  close: () => any;
};

export const Navigation: React.FC<NavigationProps> = ({ open, close, activeTab }) => {
  console.log(open);
  return (
    <Fragment>
      {activeTab === 'chat_messages' && (
        <Fragment>
          <MessageTabComponent open={open} close={close} />
        </Fragment>
      )}
      {activeTab === 'status' && (
        <Fragment>
          <StatusTabComponent />
        </Fragment>
      )}
    </Fragment>
  );
};
