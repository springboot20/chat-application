import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { classNames } from '../../utils';

export const SelectModalInput: React.FC<{
  value: string;
  options: {
    value: string;
    label: string;
    isContact?: boolean;
  }[];
  onChange: (value: { value: string; label: string; isContact?: boolean }) => void;
  placeholder: string;
  onAddToContact?: (userId: string) => void;
  showAddToContact?: boolean;
  onSearchChange?: (value: string) => void;
  lastElementRef: (node: HTMLDivElement | null) => void;
  isFetching: boolean;
}> = ({
  options,
  value,
  onChange,
  placeholder,
  onAddToContact,
  showAddToContact = false,
  onSearchChange,
  lastElementRef,
  isFetching,
}) => {
  const [localOptions, setLocalOptions] = useState<typeof options>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const selectedOption = options?.find((opt) => opt.value === value) || null;

  const handleAddToContact = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (onAddToContact) {
      onAddToContact(userId);
    }
  };

  return (
    <Combobox
      as='div'
      nullable
      onChange={(val: any) => {
        if (val) {
          onChange(val);
          setQuery('');
        }
        if (onSearchChange) onSearchChange(val);
      }}
      value={selectedOption}
      className='w-full'>
      <div className='relative mt-4'>
        <Combobox.Input
          displayValue={(option: any) => option?.label || ''}
          onChange={(event) => {
            const searchValue = event.target.value;
            setQuery(searchValue);

            if (onSearchChange) {
              onSearchChange(searchValue);
            }

            if (searchValue.trim() === '') {
              setLocalOptions(options || []);
            } else {
              setLocalOptions(
                (options || []).filter((opt) =>
                  opt.label.toLowerCase().includes(searchValue.toLowerCase()),
                ),
              );
            }
          }}
          placeholder={placeholder}
          className='w-full rounded-xl border-0 bg-gray-100 dark:bg-gray-800 py-3 pl-4 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 transition-all'
        />
        <div className='absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 pointer-events-none'>
          <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
        </div>
      </div>

      {/* Always visible options list */}
      <Combobox.Options
        static
        className='mt-2 max-h-[400px] overflow-auto rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 space-y-1'>
        {localOptions?.length === 0 && query !== '' ? (
          <div className='relative cursor-default select-none px-4 py-8 text-center text-gray-500 dark:text-gray-400'>
            <div className='mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2'>
              <svg fill='none' viewBox='0 0 24 24' stroke='currentColor' className='w-full h-full'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <p className='text-sm font-medium'>No results found</p>
            <p className='text-xs mt-1'>Try a different search term</p>
          </div>
        ) : localOptions.length > 0 ? (
          localOptions.map((opt, index) => {
            const isLast = index === localOptions.length - 1;
            const isContact = opt.isContact || false;

            return (
              <Combobox.Option
                key={opt.value}
                value={opt}
                className={({ active }) =>
                  classNames(
                    'relative cursor-pointer select-none rounded-lg px-3 py-2.5 transition-all',
                    active
                      ? 'bg-violet-50 dark:bg-violet-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  )
                }>
                {({ selected }) => (
                  <div
                    ref={isLast ? lastElementRef : null}
                    className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='flex-1 flex items-center gap-x-2 min-w-0'>
                        {/* Avatar */}
                        <div
                          className={classNames(
                            'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 transition-all',
                            selected
                              ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                          )}>
                          {opt.label[0]}
                        </div>
                        <span
                          className={classNames(
                            'block truncate text-sm',
                            selected
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'font-medium text-gray-700 dark:text-gray-300',
                          )}>
                          {opt.label}
                        </span>
                      </div>

                      {isContact && (
                        <span className='text-[10px] text-violet-600 dark:text-violet-400 font-medium uppercase tracking-wider'>
                          In Contacts
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2 shrink-0'>
                      {showAddToContact && !isContact && onAddToContact && (
                        <button
                          type='button'
                          onClick={(e) => handleAddToContact(e, opt.value)}
                          className='py-1.5 px-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-all group flex items-center gap-x-2'
                          title='Add to contacts'>
                          <UserPlusIcon className='h-4 w-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform' />
                          <span className='text-white font-nunito text-xs'>Add</span>
                        </button>
                      )}
                      {selected && (
                        <CheckIcon
                          className='h-5 w-5 text-violet-600 dark:text-violet-400'
                          strokeWidth={2.5}
                          aria-hidden='true'
                        />
                      )}
                    </div>
                  </div>
                )}
              </Combobox.Option>
            );
          })
        ) : (
          !isFetching && (
            <div className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'>
              <div className='mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2'>
                <svg
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  className='w-full h-full'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
              </div>
              <p className='text-sm font-medium'>No users found</p>
            </div>
          )
        )}

        {isFetching && (
          <div className='px-4 py-4 text-center'>
            <div className='inline-flex items-center gap-2 text-violet-600 dark:text-violet-400'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-violet-600 dark:border-violet-400 border-t-transparent'></div>
              <span className='text-sm font-medium'>Loading more...</span>
            </div>
          </div>
        )}
      </Combobox.Options>
    </Combobox>
  );
};
