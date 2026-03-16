import sentMail from '../../assets/image-sent.png';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useResendVerificationForNewUserMutation } from '../../features/auth/auth.slice';
import { Button } from '../../components/buttons/Buttons';
import { classNames } from '../../utils';

export const EmailSentMessage = () => {
  const [resendEmailVerification, { isLoading: isResending }] =
    useResendVerificationForNewUserMutation();
  const navigate = useNavigate();

  const location = useLocation();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const { url, email } = location.state;

  const hanleEmailVerification = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResendEmailVerificationForNewUser = async () => {
    if (cooldown > 0) return;
    try {
      const { data } = await resendEmailVerification({ email }).unwrap();
      const { url } = data;
      setCooldown(60);

      navigate('/auth/email-sent', {
        state: {
          url,
          email,
        },
      });
    } catch (error) {
      console.log(error);
      toast.error('Failed to resend email');
    }
  };

  return (
    <div className='h-screen flex items-center justify-center'>
      <div className='flex items-center flex-col max-w-xl bg-white p-6 shadow-sm rounded-2xl border'>
        <div className=''>
          <img src={sentMail} className='h-24' alt='email sent icon' />
        </div>

        <div className='mx-auto text-center flex flex-col gap-6 mt-4'>
          <div className='space-y-6'>
            <h2 className='text-2xl text-gray-800 font-semibold'>Please verify your email</h2>
            <p className='text-xl font-medium text-gray-700'>
              You're almost there! We sent an email to <span className='text-base'>{email}</span>
            </p>
          </div>

          <div>
            <p className='text-lg text-gray-800'>
              Just click on the link in that email to complete your signup. If you don't see it, you
              may need to <span className='text-gray-800 font-bold'>check you spam</span>
            </p>
          </div>

          <div className='mx-auto'>
            <p>Still can't find the email? No problem</p>
            <div className='flex items-center gap-3 mt-3'>
              <Button
                disabled={isResending || cooldown > 0}
                onClick={async () => {
                  await handleResendEmailVerificationForNewUser();
                }}
                className={classNames(
                  `flex items-center shrink-0 justify-center bg-indigo-500 text-white font-semibold rounded-md transition disabled:opacity-70 !py-2 !px-4`,
                  isResending && 'w-20 h-10',
                )}>
                {isResending ? (
                  <div className='inline-flex gap-1'>
                    <span className='animation1 h-1 w-1 bg-white rounded-full' />
                    <span className='animation2 h-1 w-1 bg-white rounded-full' />
                    <span className='animation3 h-1 w-1 bg-white rounded-full' />
                  </div>
                ) : cooldown > 0 ? (
                  <span>Resend in {cooldown}s</span>
                ) : (
                  <span>Resend Mail</span>
                )}
              </Button>

              <Button
                onClick={hanleEmailVerification}
                className='!py-2 !px-4 rounded-md capitalize bg-gray-800 focus:outline-none text-white shrink-0 '>
                verify email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
