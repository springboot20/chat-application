import React, { Fragment } from 'react';
import { MessageTabComponent } from './MessageTab';
import { StatusTabComponent } from './StatusTab';
import { classNames } from '../../utils';
import { SideNavigation } from './side-navigation';
import { ChatListItemInterface } from '../../types/chat';

type Tab = 'status' | 'chat_messages' | 'settings';

type NavigationProps = {
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
  activeTab: Tab;
  open: boolean;
  close: () => any;
  currentChat: ChatListItemInterface;
};

export const Navigation: React.FC<NavigationProps> = ({
  open,
  close,
  activeTab,
  setActiveTab,
  currentChat,
}) => {
  console.log(open);
  return (
    <Fragment>
      <Fragment>
        <SideNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === 'chat_messages' && (
          <div
            className={classNames(
              'flex-shrink-0 border-r dark:border-white/10 lg:w-[30rem]',
              currentChat ? 'hidden lg:block' : 'w-full lg:w-[30rem]', // Hide list on mobile when chatting
              'lg:block lg:w-[30rem]',
            )}>
            <MessageTabComponent open={open} close={close} />
          </div>
        )}
      </Fragment>

      {activeTab === 'status' && (
        <Fragment>
          <StatusTabComponent />
        </Fragment>
      )}
    </Fragment>
  );
};
