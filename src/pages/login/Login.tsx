import { EyeIcon, EyeSlashIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "../../components/buttons/Buttons";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../features/auth/auth.slice";
import { toast } from "react-toastify";

export const Login = () => {
  const [login] = useLoginMutation();
  const navigate = useNavigate();
  const [show, setShow] = useState<boolean>(false);

  const [value, setValue] = useState({
    email: "",
    password: "",
  });

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue({
      ...value,
      [name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

     try {
      const response = await login({ ...value }).unwrap();

      toast(response?.data?.message, { type: "success" });

    await Promise.resolve(setTimeout(() => navigate("/chat"), 1200));
     } catch (error: any) {
       toast(error?.data?.message, { type: "error" });
     }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-3">
      <div className="mx-auto w-full max-w-md">
        <UserCircleIcon className="mx-auto h-12 w-auto text-indigo-600" />
        <h2 className="mt-2 text-xl sm:text-2xl text-center font-semibold text-gray-700 dark:text-gray-50">
          Sign in to your account
        </h2>
      </div>
      <div className="mt-10 w-full bg-white rounded-lg p-4 sm:p-6 md:max-w-xl">
        <form
          onSubmit={async (e) => {
            await handleSubmit(e);
          }}
        >
          <fieldset>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-700 dark:text-gray-50 sm:text-base"
            >
              Email Address
            </label>
            <div className="mt-2">
              <input
                type="email"
                value={value.email}
                onChange={handleChange("email")}
                placeholder="enter your email..."
                className="block w-full px-3 rounded-md border-0 py-2.5 sm:py-4 md:py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none"
              />
            </div>
          </fieldset>

          <fieldset className="mt-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-700 dark:text-gray-50 sm:text-base"
            >
              Password
            </label>
            <div className="mt-2 relative">
              <input
                type={show ? "text" : "password"}
                placeholder="enter your password..."
                value={value.password}
                onChange={handleChange("password")}
                className="block w-full px-3 rounded-md border-0 py-2.5 sm:py-4 md:py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none"
              />
              <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 right-4"
                onClick={() => setShow(!show)}
              >
                {show ? (
                  <EyeSlashIcon className="h-6 w-6 cursor-pointer text-gray-800" />
                ) : (
                  <EyeIcon className="h-6 w-6 cursor-pointer text-gray-800 " />
                )}
              </button>
            </div>
          </fieldset>

          <div className="flex items-center justify-between mt-2">
            <div className="inline-flex items-center space-x-1">
              <div className="">
                <label htmlFor="check" className="hidden sr-only">
                  Check box
                </label>
                <input id="check" type="checkbox" className="rounded-sm" />
              </div>
              <span className="text-sm font-medium text-gray-700">Remember me</span>
            </div>
            <Link to={"/forgot"} className="text-sm text-indigo-600 font-medium">
              forgot password?
            </Link>
          </div>
          <Button
            // type="submit"
            className="block w-full mt-3 bg-indigo-500 text-white text-sm sm:text-base font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md hover:bg-indigo-400 active:bg-indigo-500 focus:ring-outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 tracking-wider sm:mt-4 md:py-2.5"
            style={{ textTransform: "uppercase" }}
          >
            Sign in
          </Button>
        </form>
      </div>
      <div className="mx-auto mt-3">
        <p className="text-center text-sm font-normal">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#4632A8]">
            SignUp
          </Link>
        </p>
      </div>
    </div>
  );
};
