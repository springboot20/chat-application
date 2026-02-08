import { useState } from 'react';
import { StatusListComponent } from './list/StatusList';
import { MyStatusListComponent } from './list/MyStatusList';
import { useStatusStories } from '../../hooks/useStatusStories';

export const StatusUpdates = () => {
  const [showMyStatusList, setShowMyStatusList] = useState(false);
  const { handleSelectedStatusToView } = useStatusStories();

  return (
    <div className='flex flex-col h-full overflow-hidden gap-y-4'>
      {/* TOP: Current User */}
      <div>
        <MyStatusListComponent
          showMyStatusList={showMyStatusList}
          setShowMyStatusList={setShowMyStatusList}
          onViewStatus={handleSelectedStatusToView}
        />
      </div>

      {/* BOTTOM: Everyone Else (Scrollable) */}
      {!showMyStatusList && (
        <div className='flex-1 overflow-y-auto'>
          <StatusListComponent onViewStatus={handleSelectedStatusToView} />
        </div>
      )}
    </div>
  );
};
