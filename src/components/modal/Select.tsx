import { Combobox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { classNames } from "../../utils";

export const SelectModalInput: React.FC<{
  value: string;
  options:
    | {
        value: string;
        label: string;
      }[]
    | undefined;
  onChange: (value: { value: string; label: string }) => void;
  placeholder: string;
}> = ({ options, value, onChange, placeholder }) => {
  const [localOptions, setLocalOptions] = useState<typeof options>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  return (
    <Combobox
      className="w-full"
      as="div"
      onChange={(val) => onChange(val)}
      value={options?.find((opt) => opt.value === value)}
    >
      <div className="relative mt-4">
        <Combobox.Button className="w-full">
          <Combobox.Input
            displayValue={(option: (typeof options)[0]) => option?.label}
            onChange={(event) => {
              setLocalOptions(options?.filter((opt) => opt.label.includes(event.target.value)));
              setQuery(event.target.value);
            }}
            placeholder={placeholder}
            className="w-full px-5 py-4 bg-gray-200 text-gray-800 font-medium text-base block rounded-xl border-0 outline outline-[1px] outline-zinc-400 placeholder:text-gray-700 focus:ring-[1px] focus:ring-white"
          />
        </Combobox.Button>
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-8 w-8 text-gray-700" aria-hidden="true" />
        </Combobox.Button>

        {localOptions?.length > 0 && (
          <Combobox.Options className="outline outline-[1px] outline-zinc-400 bg-white absolute z-10 mt-2 p-2 max-h-60 w-full overflow-auto rounded-2xl dark:bg-gray-800 text-base shadow-lg ring-opacity-5 focus:outline-none sm:text-sm">
            {localOptions?.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-white">
                Nothing found.
              </div>
            ) : (
              localOptions?.map((opt) => {
                return (
                  <Combobox.Option
                    key={opt.value}
                    value={opt}
                    className={({ active }) =>
                      classNames(
                        "cursor-pointer relative rounded-2xl select-none py-4 pl-3 pr-9 dark:text-white ",
                        active ? "bg-gray-200 dark:bg-gray-700 text-gray-700 " : "text-gray-800"
                      )
                    }
                  >
                    {({ active, selected }) => (
                      <>
                        <span
                          className={classNames("block truncate", selected ? "font-semibold" : "")}
                        >
                          {opt.label}
                        </span>
                        {selected && (
                          <span
                            className={classNames(
                              "absolute inset-y-0 right-0 flex items-center pr-4",
                              active ? "text-green-700" : "text-green-600"
                            )}
                          >
                            <CheckIcon className="h-7 w-7 stroke-[4]" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                );
              })
            )}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
};
``;
