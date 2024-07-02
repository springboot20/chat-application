import { Switch } from '@headlessui/react';
import React from 'react';
import { classNames } from '../utils';

export const ModeToggler: React.FC<{
  icon: JSX.Element;
  active: boolean;
  setTheme: React.Dispatch<React.SetStateAction<string | null>>;
  activate: (theme: string) => void;
  className: string | undefined;
}> = ({ icon, active, setTheme, activate, className }) => {
  const toggleTheme = () => {
    if (active) {
      activate('light');
      setTheme('light');
    } else {
      activate('dark');
      setTheme('dark');
    }
  };

  return (
    <div className={className}>
      <Switch
        checked={active}
        onChange={toggleTheme}
        className={classNames(
          'relative bg-slate-200 appearance-none w-[44px] h-[22px] rounded-[20px]',
          active ? 'after:left-[calc(100%-22px)]' : 'after:left-0',
          ' after:absolute after:h-[22px]  after:w-[22px] after:bg-slate-500 after:rounded-full after:top-0 after:scale-[0.7] after:transition'
        )}></Switch>
      {icon}
    </div>
  );
};
