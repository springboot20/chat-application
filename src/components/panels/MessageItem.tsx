import { ChatMessageType } from '../../types/chat.type'
import { classNames } from '../../utils'

export const MessageItem: React.FC<{
  isOwnedMessage?: boolean
  isGroupChatMessage?: boolean
  message: ChatMessageType
}> = ({ isOwnedMessage, isGroupChatMessage, message }) => {
  return (
    <div
      className={classNames(
        'flex items-end justify-start absolute w-32 top-32 rounded-xl bg-[#615EF0] right-0',
      )}
    >
      <div
        className={classNames(
          'p-4 rounded-3xl flex flex-col',
          isOwnedMessage
            ? 'order-1 rounded-br-none bg-primary'
            : 'order-2 rounded-bl-none bg-secondary',
        )}
      >
        {isGroupChatMessage && !isOwnedMessage ? (
          <p
            className={classNames(
              'text-lg text-white font-semibold mb-2',
              ['text-success', 'text-danger'][
                message.sender.username.length % 2
              ],
            )}
          >
            {message.sender?.username}
          </p>
        ) : null}
        {message.content ? (
          <p className="text-lg font-semibold text-white">{message.content}</p>
        ) : null}
      </div>
    </div>
  )
}
