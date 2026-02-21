import { Dialog, Switch } from '@headlessui/react';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  Bars2Icon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { Field, FieldArray, Form, Formik } from 'formik';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';
import * as yup from 'yup';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCreatePollingVoteMessageMutation } from '../../features/chats/chat.slice';
import { classNames } from '../../utils';
import { useAppSelector } from '../../redux/redux.hooks';
import { RootState } from '../../app/store';

interface PollingFormState {
  questionTitle: string;
  allowMultipleAnswer: boolean;
  options: Array<{
    id?: string;
    optionValue: string;
  }>;
}

const initialFormState: PollingFormState = {
  questionTitle: '',
  allowMultipleAnswer: false,
  options: [
    { id: nanoid(), optionValue: '' },
    { id: nanoid(), optionValue: '' },
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

const SortableOption = ({ id, index, removeOption, optionsLength }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className='space-y-1'>
      <Field name={`options.${index}.optionValue`}>
        {({ field, meta }: any) => (
          <>
            <div className='flex items-center gap-x-2'>
              {/* Drag Handle */}
              <button
                type='button'
                {...attributes}
                {...listeners}
                className='cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-500'>
                <Bars2Icon className='size-5' />
              </button>

              <input
                type='text'
                {...field}
                placeholder={`Option ${index + 1}`}
                className='flex-1 w-full rounded-lg border-0 bg-gray-100 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 transition-all focus:ring-2 focus:ring-indigo-500'
              />

              {optionsLength > 2 && (
                <button
                  type='button'
                  onClick={() => removeOption(index)}
                  className='flex items-center justify-center p-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'>
                  <TrashIcon className='size-4' strokeWidth={2} />
                </button>
              )}
            </div>
            {meta.touched && meta.error && (
              <small className='text-xs text-red-500 ml-7 block'>{meta.error}</small>
            )}
          </>
        )}
      </Field>
    </div>
  );
};

export const PollingMessageModal: React.FC<{
  open: boolean;
  close: () => void;
}> = ({ open, close }) => {
  const { currentChat } = useAppSelector((state: RootState) => state.chat);
  const [createPollingVoteMessage, { isLoading }] = useCreatePollingVoteMessageMutation();

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <Dialog open={open} onClose={close} className='relative z-[60]'>
      <Dialog.Backdrop className='fixed inset-0 z-50 bg-gray-500/75 dark:bg-black/70 transition-opacity' />

      <div className='fixed inset-0 w-screen overflow-y-auto'>
        <div className='flex min-h-full items-center justify-center p-4'>
          <Dialog.Panel className='flex w-full max-w-xl transform bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-xl transition-all'>
            <div className='relative w-full'>
              <div className='flex items-center justify-between w-full h-16 px-6 border-b dark:border-gray-800'>
                <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                  Create Polling
                </Dialog.Title>
                <button onClick={close} className='text-gray-400 hover:text-gray-600'>
                  <XMarkIcon className='size-6' />
                </button>
              </div>

              <Formik
                initialValues={initialFormState}
                validationSchema={pollingSchema}
                onSubmit={async (values) => {
                  try {
                    const response = await createPollingVoteMessage({
                      chatId: currentChat?._id,
                      questionTitle: values.questionTitle,
                      options: values.options.map((opt) => ({
                        optionValue: opt.optionValue,
                      })),
                      allowMultipleAnswer: values.allowMultipleAnswer,
                    }).unwrap();

                    if (response.data) {
                      close(); // Close modal on success
                    }
                  } catch (error) {
                    console.error('Failed to create poll', error);
                  }
                }}>
                {({ values, setFieldValue, errors }) => {
                  const canSendPollingVote = Object.keys(errors).length > 0;

                  console.log(errors);
                  console.log(canSendPollingVote);

                  return (
                    <Form>
                      <div className='flex items-center justify-between p-4 border-b dark:border-gray-800'>
                        <div>
                          <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
                            Multiple answers
                          </h4>
                          <p className='text-xs text-gray-500'>
                            Allow voters to select more than one option
                          </p>
                        </div>

                        <Switch
                          checked={values.allowMultipleAnswer}
                          onChange={(checked: boolean) =>
                            setFieldValue('allowMultipleAnswer', checked)
                          }
                          className={`${
                            values.allowMultipleAnswer
                              ? 'bg-indigo-600'
                              : 'bg-gray-200 dark:bg-gray-700'
                          } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}>
                          <span
                            aria-hidden='true'
                            className={`${
                              values.allowMultipleAnswer ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </Switch>
                      </div>
                      <div className='p-6'>
                        {/* Question Title Field... (Keep your existing title code) */}
                        <div className='mb-6'>
                          <label className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 inline-block'>
                            Question Title
                          </label>
                          <Field
                            name='questionTitle'
                            className='w-full rounded-lg border-0 bg-gray-100 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white'
                          />
                        </div>

                        <FieldArray name='options'>
                          {({ remove }) => (
                            <div className='mt-4'>
                              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 inline-block'>
                                Options (Drag to reorder)
                              </label>

                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event: DragEndEvent) => {
                                  const { active, over } = event;
                                  if (over && active.id !== over.id) {
                                    const oldIndex = values.options.findIndex(
                                      (opt) => opt.id === active.id,
                                    );
                                    const newIndex = values.options.findIndex(
                                      (opt) => opt.id === over.id,
                                    );

                                    const newOrder = arrayMove(values.options, oldIndex, newIndex);
                                    setFieldValue('options', newOrder);
                                  }
                                }}>
                                <SortableContext
                                  items={values.options.map((opt) => String(opt.id))}
                                  strategy={verticalListSortingStrategy}>
                                  <div className='space-y-3'>
                                    {values.options.map((opt: any, index: number) => (
                                      <SortableOption
                                        key={opt.id}
                                        index={index}
                                        id={opt.id}
                                        removeOption={remove}
                                        optionsLength={values.options.length}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>

                              <button
                                type='button'
                                className='flex items-center gap-x-2 text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white mt-6 hover:bg-indigo-700 transition-colors ml-auto'
                                onClick={() =>
                                  setFieldValue('options', [
                                    ...values.options,
                                    { id: nanoid(), optionValue: '' },
                                  ])
                                }>
                                <PlusIcon className='size-4' />
                                <span>Add Option</span>
                              </button>
                            </div>
                          )}
                        </FieldArray>

                        <motion.button
                          key='send-button'
                          title='Send message'
                          type='submit'
                          disabled={canSendPollingVote || isLoading}
                          initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
                          transition={{
                            duration: 0.2,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          className={classNames(
                            'p-3 rounded-full transition-colors duration-200 shadow-lg flex items-center space-x-3 justify-center',
                            !canSendPollingVote
                              ? 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed',
                          )}
                          whileHover={!canSendPollingVote ? { scale: 1.1 } : {}}
                          whileTap={!canSendPollingVote ? { scale: 0.95 } : {}}>
                          <PaperAirplaneIcon className='h-5 w-5' /> <span>Create Polling</span>
                        </motion.button>
                      </div>
                    </Form>
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
