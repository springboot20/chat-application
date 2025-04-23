import { EyeIcon, EyeSlashIcon, PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "../../components/buttons/Buttons";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { classNames } from "../../utils";
import { useRegisterMutation } from "../../features/auth/auth.slice";
import { toast } from "react-toastify";

export const Register = () => {
  const navigate = useNavigate();
  const [register] = useRegisterMutation();
  const [show, setShow] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDropping, setIsDropping] = useState<boolean>(false);

  const [value, setValue] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue({
      ...value,
      [name]: event.target.value,
    });
  };

  const fileExtensions: string[][] = [
    [".png", ".jpeg"],
    [".jpg", ".svg"],
  ];

  const formData = new FormData();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  console.log(selectedFile);

  const isFileExtValid = (file: string) => {
    return fileExtensions.some((ext) => ext.includes(file));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      if (fileExt) {
        const extExists = isFileExtValid(`.${fileExt}`);
        console.log(extExists);

        if (!extExists) {
          alert("Invalid file extension");
          return;
        }
      }
    }

    formData.append("avatar", selectedFile as Blob);

    try {
      const response = await register({ ...value }).unwrap();
      toast(response?.data?.message, { type: "success" });
      await Promise.resolve(setTimeout(() => navigate("/login"), 1200));
    } catch (error: any) {
      toast(error?.data?.message, { type: "error" });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropping(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setSelectedFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragLeave = () => {
    setIsDropping(false);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsDropping(true);
  };

  console.log(value);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-3">
      <div className="mx-auto w-full max-w-md">
        <UserCircleIcon className="mx-auto h-12 w-auto text-indigo-600" />
        <h2 className="mt-2 text-3xl text-center font-semibold text-gray-800 dark:text-gray-50">
          Sign up to create an account
        </h2>
      </div>
      <div className="mt-10 w-full bg-white rounded-lg p-4 sm:p-6 md:max-w-xl">
        <form onSubmit={handleSubmit}>
          <fieldset>
            <label
              htmlFor="username"
              className="text-sm font-semibold text-gray-800 dark:text-gray-50"
            >
              Username
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="username"
                onChange={handleChange("username")}
                placeholder="enter your username..."
                className="block w-full px-3 rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none"
              />
            </div>
          </fieldset>
          <fieldset className="mt-3">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-800 dark:text-gray-50"
            >
              Email Address
            </label>
            <div className="mt-2">
              <input
                type="email"
                placeholder="enter your email..."
                name="email"
                onChange={handleChange("email")}
                className="block w-full px-3 rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none"
              />
            </div>
          </fieldset>

          <fieldset className="mt-3">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-800 dark:text-gray-50"
            >
              Password
            </label>
            <div className="mt-2 relative">
              <input
                type={show ? "text" : "password"}
                name="password"
                onChange={handleChange("password")}
                placeholder="enter your password..."
                className="block w-full px-3 rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none"
              />
              <button
                type="button"
                className="absolute top-1/2 -translate-y-1/2 right-4"
                onClick={() => setShow(!show)}
              >
                {show ? (
                  <EyeSlashIcon className="h-6 w-6 cursor-pointer text-gray-700 stroke-[3]" />
                ) : (
                  <EyeIcon className="h-6 w-6 cursor-pointer text-gray-500 stroke-[3]" />
                )}
              </button>
            </div>
          </fieldset>

          <fieldset className="mt-3">
            <label
              htmlFor="photo"
              className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-50"
            >
              Photo
            </label>
            <div className="mt-2 flex items-center gap-x-3">
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="uploads"
                  className="h-10 w-10 object-cover shadow-lg mb-3 ring-2 ring-offset-2 ring-indigo-500 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-12 w-12 text-gray-300" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Change
              </button>
            </div>
          </fieldset>

          <fieldset className="mt-3">
            <label
              htmlFor="photo-upload"
              className="text-sm font-semibold text-gray-800 dark:text-gray-50"
            >
              Upload photo
            </label>
            <div
              className={classNames(
                "border-dashed px-6 py-9 mt-2 border-2 rounded-md flex justify-center",
                isDropping ? "border-indigo-400" : "border-gray-400"
              )}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="upload"
                    className="h-32 w-32 object-cover shadow-lg mb-3 ring-2 ring-offset-2 ring-indigo-500 rounded-full mx-auto"
                  />
                ) : (
                  <PhotoIcon className="mx-auto h-11 w-11 text-gray-500 dark:text-gray-50" />
                )}
                <div className="text-center">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer rounded-md font-semibold text-indigo-600 hover:text-indigo-500 "
                  >
                    <span>Upload photo</span>
                    <input
                      type="file"
                      id="photo-upload"
                      name="photo-upload"
                      hidden
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1 dark:text-gray-50">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500 dark:text-gray-200">
                  PNG, JPEG, JPG, GIF and SVG up to 5mb
                </p>
              </div>
            </div>
          </fieldset>

          <Button
            type="submit"
            className="block w-full mt-5 bg-indigo-500 text-white text-sm font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md"
          >
            Sign up
          </Button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-50">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          login
        </Link>
      </p>
    </div>
  );
};
