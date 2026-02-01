import { useContext } from 'react';
import { StatusContext } from '../context/StatusContext';

export const useStatusStories = () => {
  const context = useContext(StatusContext);

  if (!context) {
    throw new Error('useStatusStories must be used within a StatusProvider');
  }

  return context;
};
