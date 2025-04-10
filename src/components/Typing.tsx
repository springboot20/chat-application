import { classNames } from "../utils";

const Typing = () => {
  return (
    <div
      className={classNames(
        "p-5 rounded-3xl bg-secondary w-fit inline-flex gap-1.5"
      )}
    >
      <span className="animation1 mx-[0.5px] h-20 w-20 bg-zinc-300 rounded-full"></span>
      <span className="animation2 mx-[0.5px] h-20 w-20 bg-zinc-300 rounded-full"></span>
      <span className="animation3 mx-[0.5px] h-20 w-20 bg-zinc-300 rounded-full"></span>
    </div>
  );
};

export default Typing;
