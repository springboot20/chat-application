import { ButtonProps } from '../../types/button'
import { classNames } from '../../utils'

export const Button = ({ children, ...rest }: ButtonProps) => {
  return (
    <button
      {...rest}
      className={classNames(
        'inline-flex flex-shrink-0 justify-center items-center text-cente shadow-sm transition px-5 py-2.5 sm:py-3.5',
        rest.className ?? '',
      )}
    >
      {children}
    </button>
  )
}
