import { Switch } from "@headlessui/react";
import React from "react";
import { classNames } from "../utils";
import { useTheme } from "../context/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const ModeToggler: React.FC = () => {
  const { activateTheme, activeMode, setTheme } = useTheme();

  const toggleTheme = () => {
    if (activeMode) {
      activateTheme("light");
      setTheme("light");
    } else{
      activateTheme("dark");
      setTheme("dark");

    }

    console.log("clicked");
  };

  return (
    <div className="flex items-center gap-8">
      <Switch
        checked={activeMode}
        onChange={toggleTheme}
        className={classNames(
          "relative bg-slate-200 appearance-none w-[44px] h-[22px] rounded-[20px]",
          activeMode ? "after:-translate-x-[calc(100%-22px)]" : "after:left-0",
          " after:absolute after:h-[22px]  after:w-[22px] after:bg-slate-500 after:rounded-full after:top-0 after:scale-[0.7] after:transition"
        )}
      ></Switch>
      {activeMode ? (
        <MoonIcon className="h-10 w-10 text-white" />
      ) : (
        <SunIcon className="h-10 w-10 text-gray-700" />
      )}
    </div>
  );
};
