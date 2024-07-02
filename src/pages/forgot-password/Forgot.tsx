import { UserCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '../../components/buttons/Buttons'
import { useState } from 'react'

export const Forgot = () => {
  const [email, setEmail] = useState<string>('')

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-3 md:p-0">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <UserCircleIcon className="mx-auto h-12 w-auto text-indigo-600" />
        <h2 className="mt-2 text-lg text-center font-semibold text-gray-800">
          Enter your email to reset your password
        </h2>
      </div>
      <div className="mt-10 w-full bg-white rounded-lg p-4 sm:p-6 md:max-w-xl">
        <form action="">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter your email..."
                className="block w-full px-3 rounded-md border-0 py-2 sm:py-4 md:py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none"
              />
            </div>
          </fieldset>

          <Button
            type="submit"
            className="block w-full mt-3 bg-indigo-500 text-white text-sm sm:text-base font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md hover:bg-indigo-400 active:bg-indigo-500 focus:ring-outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 tracking-wider sm:mt-4 md:py-2.5"
            style={{ textTransform: 'uppercase' }}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
