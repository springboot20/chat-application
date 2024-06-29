import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/buttons/Buttons';
import { useState } from 'react';

export const Forgot = () => {
  const [email, setEmail] = useState<string>('');

  return (
    <div className='flex flex-col justify-center items-center min-h-screen'>
      <div className='sm:mx-auto sm:w-full sm:max-w-xl'>
        <UserCircleIcon className='sm:mx-auto h-12 w-auto text-indigo-600' />
        <h2 className='mt-2 text-3xl text-center font-semibold text-gray-800'>
          Enter your email to reset your password
        </h2>
      </div>
      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-xl'>
        <form action=''>
          <fieldset>
            <label htmlFor='email' className='text-sm font-semibold text-gray-800'>
              Email Address
            </label>
            <div className='mt-2'>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='enter your email...'
                className='block w-full px-3 rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none'
              />
            </div>
          </fieldset>

          <Button
            type='submit'
            className='block w-full mt-5 bg-indigo-500 text-white text-sm font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md'>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
