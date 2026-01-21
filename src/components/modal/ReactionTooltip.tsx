import { Dialog, Transition } from '@headlessui/react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useMemo } from 'react';

type CategorizedReaction = {
  _id: string;
  emoji: string;
  userIds: string[];
  count: number;
  users: {
    _id: string;
    username: string;
    avatar?: { url?: string; localPath?: string; _id: string };
  }[];
};

type ReactionTooltipProps = {
  totalReactions: number;
  uniqueEmojis: number;
  topReaction: CategorizedReaction | null;
  userHasReacted: boolean;
  categorizedReactions: CategorizedReaction[];
};

type UserReaction = {
  userId: string;
  username: string | undefined;
  avatar?: { url?: string; localPath?: string; _id: string };
  emoji: string;
};

const ReactionTooltip: React.FC<{
  open: boolean;
  onClose: () => void;
  stats: ReactionTooltipProps;
}> = ({ open, onClose, stats }) => {
  const userReactions = useMemo<UserReaction[]>(() => {
    if (!stats.categorizedReactions) return [];

    return stats.categorizedReactions.flatMap((reaction) =>
      reaction.users.map((user) => ({
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        emoji: reaction.emoji,
      })),
    );
  }, [stats.categorizedReactions]);

  // Calculate total reactions count
  const totalReactions = useMemo(
    () => stats.categorizedReactions?.reduce((sum, reaction) => sum + reaction.count, 0) || 0,
    [stats.categorizedReactions],
  );

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'>
          <div className='fixed inset-0 bg-black/25 dark:bg-black/70 bg-opacity-75 transition-opacity' />
        </Transition.Child>

        <div className='fixed inset-0 z-10 overflow-y-visible'>
          <div className='flex min-h-full justify-center p-4 text-center items-center sm:p-0'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'>
              <Dialog.Panel
                className='relative transform overflow-x-hidden rounded-lg bg-white dark:bg-black dark:border dark:border-white/10 px-4 pb-4 pt-5 text-left transition-all sm:my-8 w-full sm:max-w-xl sm:p-6 h-full'
                style={{
                  overflow: 'inherit',
                }}>
                <div>
                  <div className='flex justify-between items-center'>
                    <Dialog.Title
                      as='h3'
                      className='text-2xl font-medium leading-6 text-gray-900 dark:text-white'>
                      Reactions ({totalReactions})
                    </Dialog.Title>
                    <button
                      type='button'
                      className='bg-gray-300 hover:text-zinc-600 dark:bg-white/5 rounded-full dark:border dark:border-white/10 p-1.5 flex justify-center items-center'
                      onClick={onClose}>
                      <span className='sr-only'>Close</span>
                      <XMarkIcon
                        strokeWidth={2.5}
                        className='h-4 text-gray-800 dark:text-white'
                        aria-hidden='true'
                      />
                    </button>
                  </div>

                  <div className='flex items-center flex-wrap gap-2 my-4'>
                    {(stats.categorizedReactions || [])?.map((reaction) => {
                      return (
                        <div
                          key={reaction.emoji}
                          title={`${reaction.count} ${
                            reaction.count === 1 ? 'person' : 'people'
                          } reacted with ${reaction.emoji}`}
                          className='flex items-center gap-2 dark:bg-white/5 bg-gray-300/30 dark:border-white/10 dark:shadow-none shadow-sm border-[1.75px] rounded-full w-12 h-12 justify-center hover:dark:bg-white/10 cursor-pointer'>
                          <div className='flex items-center gap-2'>
                            <span className='text-lg'>{reaction.emoji}</span>
                          </div>
                          <span className='text-xs font-medium dark:text-gray-400'>
                            {reaction.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className='mt-5 max-h-[15rem] overflow-y-auto px-2 space-y-1'>
                    {userReactions?.map((reaction, index) => {
                      return (
                        <button
                          key={`${reaction.userId}-${reaction.emoji}-${index}`}
                          className='flex justify-between items-center gap-2 w-full'>
                          <div className='flex items-center gap-2'>
                            <span className='flex items-center justify-center h-10 w-10 rounded-full dark:bg-white/5 bg-gray-300/30 dark:border-white/10 dark:shadow-none shadow-sm overflow-hidden'>
                              <UserIcon className='text-gray-400 h-5' />
                            </span>
                            <span className='dark:text-white'>{reaction?.username}</span>
                          </div>

                          <div className='dark:bg-white/5 px-4 py-1 rounded-full hover:dark:bg-white/10 bg-gray-300/30 dark:border-white/10 dark:shadow-none shadow-sm border-[1.75px] cursor-pointer'>
                            <div className='flex items-center gap-2'>
                              <span className='text-lg'>{reaction.emoji}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ReactionTooltip;
