import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/buttons/Buttons'
import { UserCircleIcon } from '@heroicons/react/24/outline'

export const OtpForm: React.FC<{ initialExpiresIn: number }> = ({
  initialExpiresIn,
}) => {
  const [expiresIn, setExpiresIn] = useState<number>(initialExpiresIn ?? 0)

  useEffect(() => {
    if (expiresIn > 0) {
      const expireTime = setInterval(() => {
        setExpiresIn((prev) => prev - 1)
      }, 1000)
      return () => {
        clearInterval(expireTime)
      }
    }
  }, [expiresIn])

  const length = 6
  const [otp, setOTP] = useState<string[]>([])
  const [values, setValues] = useState<string[]>(
    Array.from({ length }, () => ''),
  )
  const inputRefs = useRef<HTMLInputElement[]>(Array(length).fill(null))

  const onChange = (values: string[]) => {
    setOTP(values)
  }

  useEffect(() => {
    window.addEventListener('load', () => {
      inputRefs.current[0]?.focus()
    })

    console.log(values)
    console.log(otp.join(''))
  })

  const handleChange = (value: string, index: number) => {
    const updatedOtp = [...values]

    updatedOtp[index] = value
    setValues(updatedOtp)
    onChange(updatedOtp)

    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === 'Backspace' && index > 0 && values[index] === '') {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text')
    if (/^\d+$/.test(pasteData) && pasteData.length <= length) {
      const updatedOTP = pasteData.split('').slice(0, length)
      setValues([...updatedOTP, ...Array(length - updatedOTP.length).fill('')])
      onChange(updatedOTP)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}`
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen p-3 md:p-0">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <UserCircleIcon className="mx-auto h-12 w-auto text-indigo-600" />
        <h2 className="mt-2 text-xl text-center font-semibold text-gray-800">
          Enter the otp code sent your email
        </h2>
      </div>
      <div className="mt-2 w-auto bg-white rounded-lg p-4 sm:p-6 md:max-w-sm">
        <form className="w-full flex flex-col h-auto">
          <div className="flex items-center justify-between w-full space-x-2 lg :space-x-0">
            {values.map((v, index) => (
              <fieldset key={index}>
                <label htmlFor="number" className="hidden sr-only">
                  {index}
                </label>
                <input
                  id="number"
                  type="text"
                  value={v}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{1}"
                  disabled={expiresIn === 0}
                  onChange={(event) => handleChange(event.target.value, index)}
                  onKeyUp={(event) => handleKeyDown(event, index)}
                  ref={(el) => el && (inputRefs.current[index] = el)}
                  onPaste={handlePaste}
                  className="block h-10 w-10 xs:h-14 xs:w-14  md:h-12 md:w-12 text-center appearance-none px-3 text font-semibold rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6 outline-none"
                />
              </fieldset>
            ))}
          </div>

          <div className="mt-2 text-gray-700">
            {expiresIn > 0 ? (
              <span>Expires in : {formatTime(expiresIn)} seconds</span>
            ) : (
              <span className="text-red-500 text-right block"> {formatTime(expiresIn)} expires</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={expiresIn === 0}
            className="block w-full mt-5 bg-indigo-500 text-white text-sm font-semibold rounded-md transform hover:-translate-y-1.5 transition shadow-md hover:bg-indigo-400 active:bg-indigo-500 focus:ring-outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 tracking-wider sm:mt-4 sm:py-2.5 disabled:bg-indigo-400 disabled:hover:translate-y-0"
          >
            Verify
          </Button>
        </form>
      </div>
    </div>
  )
}
