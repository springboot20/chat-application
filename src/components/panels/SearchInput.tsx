import { classNames } from '../../utils';

export const SearchInput: React.FC<React.HTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className={classNames(
        'block w-full px-4 p-3 font-medium text-lg text-gray-800',
        props.className ?? ''
      )}
    />
  );
};
