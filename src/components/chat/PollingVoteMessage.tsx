import React, { useState } from 'react';
import { ChatMessageInterface } from '../../types/chat';
import { classNames } from '../../utils';
import { useAppDispatch, useAppSelector } from '../../redux/redux.hooks';
import { useToggleVoteToPollingVoteMessageMutation } from '../../features/chats/chat.slice';
import { updatePollVote } from '../../features/chats/chat.reducer';

const MiniAvatar: React.FC<{
  voter: { _id: string; username: string; avatar?: { url?: string } };
}> = ({ voter }) => {
  const COLORS = ['#25D366', '#128C7E', '#34B7F1', '#9C27B0', '#E91E63', '#FF5722', '#3F51B5'];
  const bg = COLORS[voter?.username?.charCodeAt(0) % COLORS.length];

  return voter.avatar?.url ? (
    <img
      src={voter.avatar.url}
      alt={voter.username}
      title={voter.username}
      className='size-[22px] rounded-full object-cover border-2 border-white dark:border-[#1f2c34] -ml-1.5 first:ml-0'
    />
  ) : (
    <div
      title={voter.username}
      className='size-[22px] rounded-full border-2 border-white dark:border-[#1f2c34] -ml-1.5 first:ml-0 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0'
      style={{ background: bg }}>
      {voter?.username?.[0]?.toUpperCase()}
    </div>
  );
};

const VoterTooltip: React.FC<{
  voters: { _id: string; username: string; avatar?: { url?: string } }[];
  visible: boolean;
  isOwnedMessage: boolean;
}> = ({ voters, visible, isOwnedMessage }) => (
  <div
    className={classNames(
      'absolute bottom-[calc(100%+10px)] right-0 z-50 pointer-events-none',
      'rounded-xl shadow-2xl border py-2.5 px-3 min-w-[140px] max-w-[200px]',
      'transition-all duration-150',
      isOwnedMessage
        ? 'bg-[#d9fdd3] dark:bg-[#025144] border-[#b2f7cc] dark:border-[#025144]'
        : 'bg-white dark:bg-[#233138] border-gray-100 dark:border-[#2a3942]',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
    )}>
    {voters.length === 0 ? (
      <p className='text-xs text-gray-400 dark:text-gray-500'>No votes yet</p>
    ) : (
      <>
        <p className='text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2'>
          Voted
        </p>
        <div className='flex flex-col gap-1.5'>
          {voters.map((v, i) => (
            <div key={`${v._id}-${i}`} className='flex items-center gap-2'>
              <MiniAvatar voter={v} />
              <span className='text-xs text-gray-700 dark:text-gray-200 truncate'>
                {v.username}
              </span>
            </div>
          ))}
        </div>
      </>
    )}
    <div
      className={classNames(
        'absolute -bottom-[5px] right-4 w-2.5 h-[5px]',
        isOwnedMessage ? 'bg-[#d9fdd3] dark:bg-[#025144]' : 'bg-white dark:bg-[#233138]',
      )}
      style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
    />
  </div>
);

const OptionProgress: React.FC<{
  percentage: number;
  isOwnedMessage: boolean;
  isSelected: boolean;
}> = ({ percentage, isOwnedMessage, isSelected }) => (
  <div className='relative overflow-hidden rounded-full h-1.5 w-full bg-black/10 dark:bg-white/10'>
    <div
      className={classNames(
        'absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out',
        isSelected
          ? 'bg-emerald-500 dark:bg-emerald-400'
          : isOwnedMessage
            ? 'bg-[#b2d8b2] dark:bg-[#3a6655]'
            : 'bg-gray-300 dark:bg-[#3a4a52]',
      )}
      style={{ width: `${percentage}%` }}
    />
  </div>
);

const PollOption: React.FC<{
  option: ChatMessageInterface['polling']['options'][number];
  percentage: number;
  isSelected: boolean;
  isLeading: boolean;
  hasVoted: boolean;
  allowMultiple: boolean;
  isOwnedMessage: boolean;
  isPending: boolean;
  onSelect: (optionId: string) => void;
}> = ({
  option,
  percentage,
  isSelected,
  isLeading,
  hasVoted,
  allowMultiple,
  isOwnedMessage,
  isPending,
  onSelect,
}) => {
  const [tooltip, setTooltip] = useState(false);

  return (
    <div
      className='relative flex items-center gap-x-2 cursor-pointer group'
      onClick={() => !isPending && onSelect(option._id)}>
      <div className='space-y-1.5 w-full'>
        <div className='flex items-center gap-2'>
          {/* Radio / checkbox indicator */}
          <div
            className={classNames(
              'flex-shrink-0 size-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-200',
              isSelected
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-400',
              isPending && 'opacity-60',
            )}>
            {isSelected && (
              <svg width='9' height='7' viewBox='0 0 9 7' fill='none' className='flex-shrink-0'>
                <path
                  d='M1 3.5L3.2 5.5L8 1'
                  stroke='white'
                  strokeWidth='1.8'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            )}
            {allowMultiple && !isSelected && (
              <div className='size-2 rounded-sm bg-gray-200 dark:bg-gray-600' />
            )}
          </div>

          {/* Option label */}
          <span
            className={classNames(
              'text-sm flex-1 leading-tight',
              isSelected ? 'font-semibold' : 'font-normal',
            )}>
            {option.optionValue}
          </span>

          {/* Leading badge */}
          {isLeading && hasVoted && option.responses.length > 0 && (
            <span className='text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-1.5 py-0.5'>
              Leading
            </span>
          )}

          {/* Stacked avatars + percentage — revealed after voting */}
          {hasVoted && (
            <div
              className='relative flex items-center gap-1.5 flex-shrink-0'
              onMouseEnter={() => setTooltip(true)}
              onMouseLeave={() => setTooltip(false)}>
              <div className='flex items-center'>
                {option.responses.slice(0, 3).map((voter) => (
                  <MiniAvatar key={voter._id} voter={voter} />
                ))}
                {option.responses.length > 3 && (
                  <div className='size-[22px] rounded-full bg-gray-200 dark:bg-[#3a4a52] border-2 border-white dark:border-[#1f2c34] -ml-1.5 flex items-center justify-center text-[9px] text-gray-500 dark:text-gray-400 font-bold'>
                    +{option.responses.length - 3}
                  </div>
                )}
              </div>
              <span
                className={classNames(
                  'text-xs font-bold min-w-[30px] text-right',
                  isSelected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400 dark:text-gray-500',
                )}>
                {percentage}%
              </span>
              <VoterTooltip
                voters={option.responses}
                visible={tooltip}
                isOwnedMessage={isOwnedMessage}
              />
            </div>
          )}
        </div>

        {/* Progress bar — revealed after voting */}
        {hasVoted && (
          <OptionProgress
            percentage={percentage}
            isOwnedMessage={isOwnedMessage}
            isSelected={isSelected}
          />
        )}
      </div>
    </div>
  );
};

interface PollingVoteMessageProps {
  message: ChatMessageInterface;
  isOwnedMessage: boolean;
}

export const PollingVoteMessage: React.FC<PollingVoteMessageProps> = ({
  message,
  isOwnedMessage,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentChat } = useAppSelector((state) => state.chat);
  const currentUserId = String(user?._id);

  const [toggleVoteToPollingVoteMessage, { isLoading }] =
    useToggleVoteToPollingVoteMessageMutation();

  const { options, allowMultipleAnswer, questionTitle } = message.polling;

  // Derived values — computed fresh from Redux state on every render
  const allVoterIds = new Set(options.flatMap((opt) => opt.responses.map((r) => r._id)));
  const totalUniqueVoters = allVoterIds.size;

  const myVotedIds = options
    .filter((opt) => opt.responses.some((r) => r._id === currentUserId))
    .map((opt) => opt._id);

  const hasVoted = myVotedIds.length > 0;

  const maxVotes = Math.max(0, ...options.map((o) => o.responses.length));
  const leadingId = maxVotes > 0 ? options.find((o) => o.responses.length === maxVotes)?._id : null;

  const handleSelect = async (optionId: string) => {
    if (isLoading) return;

    const chatId = currentChat._id as string;
    const messageId = message._id;

    // Step 1 — Build optimistic options, mirroring toggleVoteToPollingVote server logic
    let optimisticOptions = options.map((o) => ({ ...o, responses: [...o.responses] }));

    if (!allowMultipleAnswer) {
      // Server clears current user from ALL options first
      optimisticOptions = optimisticOptions.map((o) => ({
        ...o,
        responses: o.responses.filter((r) => r._id !== currentUserId),
      }));
    }

    const target = optimisticOptions.find((o) => o._id === optionId);
    if (target) {
      const alreadyVoted = target.responses.some((r) => r._id === currentUserId);
      if (alreadyVoted) {
        target.responses = target.responses.filter((r) => r._id !== currentUserId);
      } else {
        // Push the real user object so the avatar renders immediately
        target.responses.push({
          _id: currentUserId,
          username: user?.username ?? 'You',
          avatar: user?.avatar,
        } as any);
      }
    }

    // Step 2 — Write optimistic result directly into Redux (no local state = no flicker)
    dispatch(updatePollVote({ messageId, chatId, options: optimisticOptions }));

    // Step 3 — Fire the API call
    try {
      await toggleVoteToPollingVoteMessage({ chatId, messageId, optionId }).unwrap();
      // The socket POLL_VOTE_UPDATED event will dispatch(updatePollVote({ options: serverOptions }))
      // which reconciles any diff. Since it's the same reducer path, no flicker occurs.
    } catch (err) {
      console.error('[PollVote] failed, rolled back:', err);
    }
  };

  return (
    <div className='w-80 text-[#667781] dark:text-[#8696a0]'>
      <p className='text-base font-medium leading-snug'>{questionTitle}</p>
      <p className='text-[11px] mt-0.5 mb-3 opacity-50'>
        {allowMultipleAnswer ? 'Multiple answers allowed' : 'Select one option'}
      </p>

      <div className='space-y-3'>
        {options.map((option, index) => {
          const voteCount = option.responses.length;
          const percentage =
            totalUniqueVoters > 0 ? Math.round((voteCount / totalUniqueVoters) * 100) : 0;

          return (
            <PollOption
              key={`${option._id}-${index}`}
              option={option}
              percentage={percentage}
              isSelected={myVotedIds.includes(option._id)}
              isLeading={leadingId === option._id}
              hasVoted={hasVoted}
              allowMultiple={allowMultipleAnswer}
              isOwnedMessage={isOwnedMessage}
              isPending={isLoading}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      <div className='flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 dark:border-white/5'>
        <span className='text-[11px] opacity-50'>
          {totalUniqueVoters} vote{totalUniqueVoters !== 1 ? 's' : ''}
        </span>
        {hasVoted ? (
          <div className='flex items-center gap-1'>
            <svg
              width='11'
              height='11'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='text-emerald-500'>
              <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
            </svg>
            <span className='text-[11px] text-emerald-500 dark:text-emerald-400 font-medium'>
              Voted · tap to change
            </span>
          </div>
        ) : (
          <span className='text-[11px] text-emerald-500 dark:text-emerald-400 font-medium animate-pulse'>
            Tap to vote
          </span>
        )}
      </div>
    </div>
  );
};
