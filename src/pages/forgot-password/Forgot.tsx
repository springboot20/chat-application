import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/buttons/Buttons';
import { useState } from 'react';
import { AuthApiSlice, useForgotPasswordMutation } from '../../features/auth/auth.slice';
import { toast } from 'react-toastify';
import { useAppDispatch } from '../../redux/redux.hooks';

export const Forgot = () => {
  const [email, setEmail] = useState<string>('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const dispatch = useAppDispatch();

  const [openModal, setOpenModal] = useState<boolean>(false);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await forgotPassword({ email }).unwrap();

      console.log({ response });

      if (response.statusCode === 200 && response.data?.success) {
        handleOpenModal();
        dispatch(AuthApiSlice.endpoints.getCurrentUser.initiate()).unwrap();
      }

      toast(response?.data?.message, { type: 'success' });
    } catch (error: any) {
      toast(error?.data?.message, { type: 'error' });
    }
  };

  const isFormInvalid = !email;

  return (
    <div className='flex flex-col justify-center items-center min-h-screen p-3 md:p-0'>
      <div className='sm:mx-auto sm:w-full sm:max-w-xl'>
        <UserCircleIcon className='mx-auto h-12 w-auto text-indigo-600' />
        <h2 className='mt-2 text-xl sm:text-2xl text-center font-semibold text-gray-700 dark:text-gray-50'>
          Enter your email to reset your password
        </h2>
      </div>
      <div className='mt-10 w-full bg-white dark:bg-white/5 rounded-lg p-4 sm:p-6 md:max-w-xl'>
        <form onSubmit={async (e) => handleSubmit(e)}>
          <fieldset>
            <label
              htmlFor='email'
              className='text-sm font-semibold text-gray-700 dark:text-gray-50 sm:text-base'>
              Email Address
            </label>
            <div className='mt-2'>
              <input
                type='email'
                value={email}
                onChange={handleChange}
                placeholder='enter your email...'
                className='block w-full px-3 rounded-md border-0 py-2.5 sm:py-4 md:py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none dark:ring-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/600'
              />
            </div>
          </fieldset>

          <Button
            type='submit'
            disabled={isLoading || isFormInvalid}
            className='flex items-center justify-center w-full mt-3 bg-indigo-500 text-white font-semibold rounded-md transition disabled:opacity-70'>
            {isLoading ? (
              <div className='inline-flex gap-1'>
                <span className='animation1 h-1 w-1 bg-white rounded-full' />
                <span className='animation2 h-1 w-1 bg-white rounded-full' />
                <span className='animation3 h-1 w-1 bg-white rounded-full' />
              </div>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
