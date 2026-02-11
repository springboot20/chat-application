import { useContext } from 'react';
import { MessageContext } from '../context/MessageContext';

export const useMessage = () => {
  const context = useContext(MessageContext);

  if (!context) {
    throw new Error('useStatusStories must be used within a StatusProvider');
  }

  return context;
};
