import { EyeIcon, EyeSlashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/buttons/Buttons';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { loginUser } = useAuth();

  const [show, setShow] = useState<boolean>(false);

  const [value, setValue] = useState({
    email: '',
    password: '',
  });

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue({
      ...value,
      [name]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loginUser(value);
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-screen'>
      <div className='sm:mx-auto sm:w-full sm:max-w-xl'>
        <UserCircleIcon className='sm:mx-auto h-12 w-auto text-indigo-600' />
        <h2 className='mt-2 text-3xl text-center font-semibold text-gray-800 dark:text-gray-50'>
          Sign in to your account
        </h2>
      </div>
      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-xl'>
        <form action='' onSubmit={handleSubmit}>
          <fieldset>
            <label
              htmlFor='email'
              className='text-sm font-semibold text-gray-800 dark:text-gray-50'>
              Email Address
            </label>
            <div className='mt-2'>
              <input
                type='email'
                value={value.email}
                onChange={handleChange('email')}
                placeholder='enter your email...'
                className='block w-full px-3 rounded-md border-0 py-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none'
              />
            </div>
          </fieldset>

          <fieldset className='mt-2'>
            <label
              htmlFor='password'
              className='text-sm font-semibold text-gray-800 dark:text-gray-50'>
              Password
            </label>
            <div className='mt-2 relative'>
              <input
                type={show ? 'text' : 'password'}
                placeholder='enter your password...'
                value={value.password}
                onChange={handleChange('password')}
                className='block w-full px-3 rounded-md border-0 py-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none'
              />
              <button
                type='button'
                className='absolute top-1/2 -translate-y-1/2 right-4'
                onClick={() => setShow(!show)}>
                {show ? (
                  <EyeSlashIcon className='h-6 w-6 cursor-pointer text-gray-800' />
                ) : (
                  <EyeIcon className='h-6 w-6 cursor-pointer text-gray-800 ' />
                )}
              </button>
            </div>
          </fieldset>

          <Button
            type='submit'
            className='block w-full mt-5 bg-indigo-500 text-white text-sm font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md'>
            Sign in
          </Button>
        </form>

        <div className='flex items-center justify-between sm:max-w-xl mt-5'>
          <NavLink to={'/forgot'} className='text-sm text-indigo-600'>
            forgot password?
          </NavLink>

          <p className='text-sm text-gray-600 dark:text-gray-50 self-end'>
            Don't have an account?{' '}
            <NavLink
              to='/register'
              className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'>
              register
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};
