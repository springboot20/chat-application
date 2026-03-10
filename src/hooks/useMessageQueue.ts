// hooks/useMessageQueue.ts
import { useCallback, useEffect } from 'react';
import { messageQueue } from '../utils/messageQueue';
import { useNetwork } from './useNetwork';
import { toast } from 'react-toastify';
import { useChat } from './useChat';
import { useSendMessage } from './useSendMessage';

export const useMessageQueue = () => {
  const { isOnline } = useNetwork();
  const { sendMessage } = useSendMessage();
  const { currentChat } = useChat();

  // Process queued messages when coming back isOnline
  const processQueue = useCallback(async () => {
    if (!isOnline) return;

    const queuedMessages = await messageQueue.getAllForChatWithFiles(currentChat?._id!);

    if (queuedMessages.length === 0) return;

    console.log(`📤 Processing ${queuedMessages.length} queued messages...`);

    for (const queuedMsg of queuedMessages) {
      try {
        await sendMessage({
          chatId: queuedMsg.chatId,
          data: {
            content: queuedMsg.content,
            attachments: queuedMsg.attachments,
            mentions: queuedMsg.mentions,
            ...(queuedMsg.replyId ? { replyId: queuedMsg.replyId } : {}),
          },
        });

        // Remove from queue on success
        messageQueue.remove(queuedMsg.id);
        console.log(`✅ Queued message sent: ${queuedMsg.id}`);
      } catch (error) {
        console.error(`❌ Failed to send queued message: ${queuedMsg.id}`, error);
        // Keep in queue to retry later
      }
    }

    const remaining = await messageQueue.getAll();
    if (remaining.length === 0) {
      toast.success('All queued messages sent!');
    } else {
      toast.warning(`${remaining.length} message(s) failed to send. Will retry.`);
    }
  }, [isOnline, sendMessage]);

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure socket is ready
      const timer = setTimeout(() => {
        processQueue();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, processQueue]);

  return {
    processQueue,
  };
};
