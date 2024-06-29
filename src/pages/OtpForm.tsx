import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../components/buttons/Buttons';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export const OtpForm = () => {
  const length = 5;
  const [otp, setOTP] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>(Array.from({ length }, () => ''));
  const inputRefs = useRef<HTMLInputElement[]>(Array(length).fill(null));

  const onChange = (values: string[]) => {
    setOTP(values);
  };

  useEffect(() => {
    window.addEventListener('load', () => {
      inputRefs.current[0]?.focus();
    });

    console.log(values);
    console.log(otp.join(''));
  });

  const handleChange = (value: string, index: number) => {
    const updatedOtp = [...values];

    updatedOtp[index] = value;
    setValues(updatedOtp);
    onChange(updatedOtp);

    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && index > 0 && values[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (/^\d+$/.test(pasteData) && pasteData.length <= length) {
      const updatedOTP = pasteData.split('').slice(0, length);
      setValues([...updatedOTP, ...Array(length - updatedOTP.length).fill('')]);
      onChange(updatedOTP);
    }
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-screen'>
      <div className='sm:mx-auto sm:w-full sm:max-w-xl'>
        <UserCircleIcon className='sm:mx-auto h-12 w-auto text-indigo-600' />
        <h2 className='mt-2 text-3xl text-center font-semibold text-gray-800'>
          Enter the otp code sent your email
        </h2>
      </div>
      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-2xl'>
        <form className='w-full flex flex-col h-auto'>
          <div className='flex items-center justify-between w-full'>
            {values.map((v, index) => (
              <fieldset key={index}>
                <input
                  type='text'
                  value={v}
                  maxLength={1}
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  pattern='\d{1}'
                  onChange={(event) => handleChange(event.target.value, index)}
                  onKeyUp={(event) => handleKeyDown(event, index)}
                  ref={(el) => el && (inputRefs.current[index] = el)}
                  onPaste={handlePaste}
                  className='block w-32 text-center appearance-none px-3 h-32 text font-semibold rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6 outline-none'
                />
              </fieldset>
            ))}
          </div>
          <Button
            type='submit'
            className='block w-full mt-5 bg-indigo-500 text-white text-sm font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md'>
            Verify OTP Code
          </Button>
        </form>
      </div>
    </div>
  );
};
