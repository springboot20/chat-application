import { Dialog } from '@headlessui/react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Field, FieldArray, Form, Formik } from 'formik';
import { Fragment } from 'react';
import * as yup from 'yup';

interface PollingFormState {
  questionTitle: string;
  options: Array<{
    optionValue: string;
  }>;
}

const initialFormState: PollingFormState = {
  questionTitle: '',
  options: [
    {
      optionValue: '',
    },
    {
      optionValue: '',
    },
  ],
};

const optionSchema = yup.object().shape({
  optionValue: yup
    .string()
    .required('Options text is required')
    .min(5, 'Option must be at least 5 characters')
    .max(500, 'Option must not exceed 500 characters'),
});

const pollingSchema = yup.object().shape({
  questionTitle: yup
    .string()
    .required('Polling title is required')
    .min(3, 'Polling title must be at least 3 characters')
    .max(200, 'Polling title must not exceed 200 characters'),

  allowMultipleAnswer: yup.boolean().nullable(),

  options: yup
    .array()
    .of(optionSchema)
    .min(2, 'At least one polling option is required')
    .required('Polling option are required'),
});

export const PollingMessageModal: React.FC<{
  open: boolean;
  close: () => void;
}> = ({ open, close }) => {
  return (
    <Dialog open={open} onClose={close} className='relative z-[60]'>
      <Dialog.Backdrop className='fixed inset-0 z-50 bg-gray-500/75 dark:bg-black/70 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in' />

      <div className='fixed inset-0 w-screen overflow-y-auto'>
        <div className='flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4 md:py-8'>
          <Dialog.Panel className='flex w-full transform text-left text-base transition data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in md:data-[closed]:translate-y-0 md:data-[closed]:scale-95 mx-auto md:max-w-xl md:rounded-2xl overflow-hidden'>
            <div className='relative bg-white dark:bg-gray-900 w-full'>
              <div className='flex items-center justify-between w-full h-20 px-4'>
                <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                  Create Polling
                </Dialog.Title>
                <button
                  type='button'
                  onClick={close}
                  className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                  <span className='sr-only'>Close</span>
                  <XMarkIcon className='size-6' />
                </button>
              </div>

              <Formik
                initialValues={initialFormState}
                validationSchema={pollingSchema}
                onSubmit={() => {}}>
                {({ setFieldValue }) => {
                  return (
                    <Fragment>
                      <Form className='p-4 md:p-8 md:pt-6'>
                        <Field name='questionTitle'>
                          {({ field, meta }: { field: any; meta: any }) => {
                            return (
                              <>
                                <label
                                  htmlFor={field.name}
                                  className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 inline-block'>
                                  Question Title
                                </label>
                                <input
                                  type='text'
                                  {...field}
                                  className='w-full rounded-lg border-0 bg-gray-100 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 transition-all'
                                />
                                {meta.touched && meta.error && (
                                  <small className='text-sm mt-0.5 block text-[#F12020] font-nunito'>
                                    {meta.error}
                                  </small>
                                )}
                              </>
                            );
                          }}
                        </Field>

                        <FieldArray name='options'>
                          {({ remove: removeOption, form }) => {
                            const { values } = form;
                            const { options } = values;

                            return (
                              <div className='mt-4'>
                                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 inline-block'>
                                  Options
                                </label>
                                <div className='space-y-5'>
                                  {options?.map((_: any, index: number) => (
                                    <Field name={`options.${index}.optionValue`} key={index}>
                                      {({ field, meta }: { field: any; meta: any }) => {
                                        return (
                                          <>
                                            <div className='flex items-center gap-x-2'>
                                              <input
                                                type='text'
                                                {...field}
                                                className='flex-1  w-full rounded-lg border-0 bg-gray-100 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 transition-all'
                                              />
                                              {options.length > 2 && (
                                                <button
                                                  type='button'
                                                  onClick={() => removeOption(index)}
                                                  className='flex items-center justify-center bg-colorB35 rounded-full shrink-0 h-full bg-red-50 text-red-700 ring-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900'>
                                                  <span className='sr-only'>Remove Option</span>
                                                  <TrashIcon
                                                    className='size-4'
                                                    strokeWidth={1.25}
                                                  />
                                                </button>
                                              )}
                                            </div>
                                            {meta.touched && meta.error && (
                                              <small className='text-sm text-[#F12020] font-nunito'>
                                                {meta.error}
                                              </small>
                                            )}
                                          </>
                                        );
                                      }}
                                    </Field>
                                  ))}
                                </div>

                                <div className='flex items-center justify-end'>
                                  <button
                                    type='button'
                                    className='flex items-center gap-x-2 text-sm px-3 py-2.5 rounded-lg bg-indigo-500 text-white mt-5'
                                    onClick={() => {
                                      setFieldValue(`options`, [
                                        ...options,
                                        {
                                          optionValue: '',
                                        },
                                      ]);
                                    }}>
                                    <PlusIcon className='size-4' />
                                    <span className='font-nunito font-medium'>Add</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }}
                        </FieldArray>
                      </Form>
                    </Fragment>
                  );
                }}
              </Formik>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};
