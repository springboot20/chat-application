import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useVerifyEmailMutation } from '../../features/auth/auth.slice';
import { motion, AnimatePresence } from 'framer-motion';

export const EmailVerification = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'idle'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifyEmail] = useVerifyEmailMutation();
  const hasAttempted = useRef(false);

  const url_params = new URLSearchParams(window.location.search);
  const userId = url_params.get('userId') as string;
  const token = url_params.get('token') as string;

  useEffect(() => {
    if (!token || !userId) {
      setStatus('failed');
      setErrorMessage('Invalid verification link.');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verify = async () => {
      setStatus('loading');
      try {
        const response = await verifyEmail({ token, userId }).unwrap();
        const { message } = response;
        setStatus('success');
        toast.success(message, { autoClose: 2000, className: 'text-xs' });
      } catch (error: any) {
        setStatus('failed');
        setErrorMessage(
          error?.data?.message || 'Verification failed. The link might be expired or invalid.',
        );
      }
    };
    verify();
  }, [verifyEmail, token, userId]);

  return (
    <div className='flex h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-900'>
      <AnimatePresence mode='wait'>
        {status === 'loading' && (
          <motion.div
            key='loading'
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3 }}
            className='flex items-center flex-col w-[90%] sm:w-full max-w-md text-center bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700/50'>
            <div className='w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-6'></div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white capitalize mb-3'>
              Verifying Account
            </h1>
            <p className='text-gray-500 dark:text-gray-400 text-sm'>
              Please wait while we securely verify your email address...
            </p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key='success'
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
            className='flex items-center flex-col w-[90%] sm:w-full max-w-md text-center bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700/50'>
            <div className='mb-6'>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className='flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto'>
                <CheckCircleIcon
                  className='h-12 w-12 text-green-600 dark:text-green-500'
                  aria-hidden={true}
                />
              </motion.span>
            </div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white capitalize mb-4'>
              Account Verified
            </h1>
            <div className='space-y-6 w-full'>
              <p className='text-gray-600 dark:text-gray-300 text-base'>
                Thank you! Your email has been successfully verified. Your account is now active and
                ready to go.
              </p>
              <button
                onClick={() => (window.location.href = '/auth/login')}
                className='w-full py-3 px-4 rounded-xl capitalize bg-indigo-600 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-bold mt-2 shadow-md active:scale-[0.98]'>
                Login to your account
              </button>
            </div>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            key='failed'
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
            className='flex items-center flex-col w-[90%] sm:w-full max-w-md text-center bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700/50'>
            <div className='mb-6'>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className='flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto'>
                <ExclamationTriangleIcon
                  className='h-12 w-12 text-red-600 dark:text-red-500'
                  aria-hidden={true}
                />
              </motion.span>
            </div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white capitalize mb-4'>
              Verification Failed
            </h1>
            <div className='space-y-6 w-full'>
              <p className='text-gray-600 dark:text-gray-300 text-base'>{errorMessage}</p>

              <div className='flex flex-col gap-3 w-full'>
                <button
                  onClick={() => (window.location.href = '/auth/login')}
                  className='w-full py-3 px-4 rounded-xl capitalize bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 text-white font-bold shadow-md active:scale-[0.98]'>
                  Go to Login
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
