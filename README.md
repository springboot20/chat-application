# Chat Application (React + TypeScript + Vite)

A modern, real‑time chat client built with React, TypeScript and Vite. The app demonstrates offline resiliency, file attachments, voice notes, polling messages, and a modular hooks/context architecture.

![Tech Stack](https://raw.githubusercontent.com/springboot20/chat-application/main/tech-stack.png)

> _Note: replace the above URL with your own image or add `public/tech-stack.png` if you prefer local assets._

---

## 🚀 Features

- Real‑time messaging with **Socket.io**
- Offline message queue using **IndexedDB** (queued messages send automatically when back online)
- File uploads (images, video, audio, documents) with per‑file progress bars
- Voice recording & upload
- Polling messages with voting
- Emoji picker, typing indicators, read receipts
- Optimistic UI updates for snappy experience
- Responsive layout with Tailwind CSS

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Real‑time | Socket.io, custom hooks (`useSocket`, `useTyping`, `useNetwork`) |
| State     | React Context + Redux Toolkit |
| Storage   | IndexedDB (IndexedDBService + message queue) |
| API       | REST endpoints (Axios wrapper `sendRequest`) |
| Tools     | ESLint, Prettier, Vite plugins |

### Logos (example)

![React](https://raw.githubusercontent.com/springboot20/chat-application/main/logos/react.svg) ![TypeScript](https://raw.githubusercontent.com/springboot20/chat-application/main/logos/typescript.svg) ![Vite](https://raw.githubusercontent.com/springboot20/chat-application/main/logos/vite.svg) ![Socket.io](https://raw.githubusercontent.com/springboot20/chat-application/main/logos/socketio.svg)

*(add or modify these links as needed)*

## 📦 Getting Started

```bash
git clone https://github.com/springboot20/chat-application.git
cd chat-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧩 Example Usage

### Sending a message with offline queue

```tsx
// src/context/MessageContext.tsx
const sendChatMessage = useCallback(async () => {
  // ...prepare optimistic message
  if (!isOnline) {
    await messageQueue.add({
      chatId: currentChat._id,
      content: processedMessage.content,
      attachments: files || undefined,
      mentions: processedMessage.mentions,
    });
    toast.info('You are offline. Message will be sent when you reconnect.');
    return;
  }
  const response = await sendMessage({ chatId: currentChat._id, data: {...} });
  // update UI
}, [isOnline, sendMessage]);
```

### Hook for processing queued messages

```ts
// src/hooks/useMessageQueue.ts
export const useMessageQueue = () => {
  const { isOnline } = useNetwork();
  const { sendMessage } = useSendMessage();
  const processQueue = useCallback(async () => {
    const queuedMessages = await messageQueue.getAllWithFiles();
    for (const msg of queuedMessages) {
      try {
        await sendMessage({ chatId: msg.chatId, data: msg });
        await messageQueue.remove(msg.id);
      } catch {}
    }
  }, [sendMessage]);
  useEffect(() => {
    if (isOnline) {
      setTimeout(processQueue, 1000);
    }
  }, [isOnline, processQueue]);
};
```

### Component example (MessageInput)

```tsx
<MessageInput
  reduxStateMessages={currentChatMessages}
  theme={theme}
  textareaRef={messageInputRef}
  handleSendMessage={handleSendMessage}
  currentChat={currentChat}
/>
```

## 📁 Project Structure

```
src/
  api/          # network layer
  components/   # UI components
  hooks/        # custom hooks (socket, network, queue, etc.)
  context/      # React context providers
  utils/        # helpers (messageQueue, mediaUtils, etc.)
  features/     # Redux slices
  pages/        # routeable pages
```

## ❤️ Contributing

PRs welcome! Please open issues for bugs or feature ideas.

## 📄 License

MIT

