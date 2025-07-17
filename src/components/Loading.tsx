import { classNames } from '../utils'

export const Loading = () => {
  return (
    <div
      className={classNames(
        'p-3 rounded-3xl bg-secondary w-fit inline-flex gap-1.5 bg-black/60 dark:border-white/10 border-[1.5px]',
      )}
    >
      <span className="animation1 mx-[0.5px] h-1 w-1 bg-zinc-300 rounded-full"></span>
      <span className="animation2 mx-[0.5px] h-1 w-1 bg-zinc-300 rounded-full"></span>
      <span className="animation3 mx-[0.5px] h-1 w-1 bg-zinc-300 rounded-full"></span>
    </div>
  )
}
