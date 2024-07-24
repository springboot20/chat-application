import React, { forwardRef } from "react";
import { classNames } from "../../utils";

export const SearchInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({...props}, ref) => {
  return (
    <input
      {...props}
      ref={ref}
      className={classNames(
        "w-full px-4 py-3 font-medium text-lg text-gray-800",
        props.className ?? ""
      )}
    />
  );
});
