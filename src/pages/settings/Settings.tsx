import { useTheme } from '../../context/ThemeContext';
import { ModeToggler } from '../../components/ModeToggler';
import {
  SunIcon,
  MoonIcon,
  XMarkIcon,
  UserIcon,
  PencilSquareIcon,
  UserCircleIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  PowerIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { useAppSelector } from '../../redux/redux.hooks';
import { UserProfileModal } from '../../components/modal/UserProfileModal';
import { classNames } from '../../utils';
import { AnimatePresence, motion } from 'framer-motion';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import {
  useChangePasswordMutation,
  useResendEmailVerificationMutation,
  useUpdateAccountMutation,
} from '../../features/auth/auth.slice';
import { toast } from 'react-toastify';

const changePasswordSchema = Yup.object().shape({
  existingPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const profileUpdateSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .required('Username is required'),
  about: Yup.string().max(100, 'About must be at most 100 characters'),
});

type TabType = 'appearance' | 'general' | 'account';

const tabs: { id: TabType; label: string; icon: any; description: string }[] = [
  {
    id: 'general',
    label: 'General',
    icon: UserCircleIcon,
    description: 'Manage your profile and info',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: SunIcon,
    description: 'Customize your theme and look',
  },
  {
    id: 'account',
    label: 'Account',
    icon: KeyIcon,
    description: 'Security and password updates',
  },
];

export const Settings: React.FC<{ open: boolean; onClose: () => void; onLogout?: () => void }> = ({
  open,
  onClose,
  onLogout,
}) => {
  const { activeMode } = useTheme();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [openProfile, setOpenProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [updateAccount, { isLoading: isUpdatingAccount }] = useUpdateAccountMutation();
  const [resendVerification, { isLoading: isResending }] = useResendEmailVerificationMutation();

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClose = () => {
    setActiveTab('general');
    setActiveSubTab(null);
    onClose();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setActiveSubTab(null);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} className='relative z-[60]'>
        <Dialog.Backdrop className='fixed inset-0 z-50 bg-gray-500/75 dark:bg-black/70 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in' />

        <div className='fixed inset-0 z-50'>
          <div className='flex min-h-full items-end justify-center p-3 text-center sm:items-center sm:p-0'>
            <Dialog.Panel className='flex w-full transform text-left text-base transition data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in md:data-[closed]:translate-y-0 md:data-[closed]:scale-95 mx-auto md:max-w-5xl md:rounded-2xl overflow-hidden'>
              <div className='relative flex flex-col md:flex-row bg-white dark:bg-gray-900 w-full min-h-screen md:min-h-[600px] md:max-h-[85vh]'>
                <div className='md:hidden flex justify-between items-center w-full h-16 px-4 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30'>
                  <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                    Settings
                  </Dialog.Title>
                  <button
                    type='button'
                    onClick={handleClose}
                    className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                    <span className='sr-only'>Close</span>
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/50'>
                  <div className='hidden md:flex justify-between items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30'>
                    <Dialog.Title className='text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
                      Settings
                    </Dialog.Title>
                    <button
                      type='button'
                      onClick={handleClose}
                      className='rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'>
                      <span className='sr-only'>Close</span>
                      <XMarkIcon className='h-6 w-6' />
                    </button>
                  </div>

                  <div className='p-4 space-y-2'>
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type='button'
                          onClick={() => handleTabChange(tab.id)}
                          className={classNames(
                            'flex items-center gap-4 p-3 w-full transition-all group',
                            'min-w-[140px] md:min-w-0',
                            isActive
                              ? 'rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-3 cursor-pointer'
                              : 'rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 font-medium flex items-center gap-3 cursor-pointer transition-colors',
                          )}>
                          <div
                            className={classNames(
                              'rounded-full p-2 transition-all',
                              isActive
                                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg'
                                : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600',
                            )}>
                            <Icon
                              className={classNames(
                                'h-5 w-5 transition-transform group-hover:scale-110',
                                isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400',
                              )}
                            />
                          </div>
                          <div className='text-left flex-1'>
                            <p
                              className={classNames(
                                'text-sm font-semibold',
                                isActive
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300',
                              )}>
                              {tab.label}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 hidden md:block'>
                              {tab.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className='space-y-6 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/50 p-6'>
                  <AnimatePresence mode='wait'>
                    {/* Profile Section */}

                    {activeTab === 'general' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}>
                        <section>
                          <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1'>
                            Account Profile
                          </h4>
                          <div className='flex justify-between w-full items-center rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border dark:border-gray-700/50'>
                            <div className='flex items-center gap-4'>
                              <div className='flex items-center relative flex-shrink-0 h-16 w-16 '>
                                {currentUser?.avatar?.url ? (
                                  <img
                                    src={currentUser.avatar.url}
                                    alt={currentUser.username}
                                    className='h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'
                                  />
                                ) : (
                                  <div className='h-16 w-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800'>
                                    <UserIcon className='h-8 w-8 text-gray-400' />
                                  </div>
                                )}
                              </div>
                              <div className='text-left'>
                                <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                                  {currentUser?.username || 'Guest User'}
                                </h3>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                  {currentUser?.email}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setOpenProfile(true)}
                              className='p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-600 dark:text-indigo-400 transition-all active:scale-95'
                              title='Edit Profile'>
                              <PencilSquareIcon className='h-6 w-6' />
                            </button>
                          </div>

                          <div className='mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700/50'>
                            <div className='flex items-center gap-3 mb-6 border-b dark:border-gray-700 pb-4'>
                              <div className='p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg'>
                                <UserIcon className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                              </div>
                              <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                                Edit Profile
                              </h3>
                            </div>

                            <Formik
                              initialValues={{
                                username: currentUser?.username || '',
                                about: currentUser?.about || '',
                              }}
                              validationSchema={profileUpdateSchema}
                              enableReinitialize
                              onSubmit={async (values) => {
                                try {
                                  await updateAccount(values).unwrap();
                                  toast.success('Profile updated successfully');
                                } catch (error: any) {
                                  toast.error(error?.data?.message || 'Failed to update profile');
                                }
                              }}>
                              {({ isValid, dirty }) => (
                                <Form className='space-y-5'>
                                  <div className='space-y-1.5'>
                                    <label className='block text-xs font-bold text-gray-500 uppercase ml-1'>
                                      Username
                                    </label>
                                    <Field
                                      name='username'
                                      className='block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 transition-all dark:text-white'
                                      placeholder='How others see you'
                                    />
                                    <ErrorMessage
                                      name='username'
                                      component='p'
                                      className='text-xs text-red-500 font-medium ml-1'
                                    />
                                  </div>

                                  <div className='space-y-1.5'>
                                    <label className='block text-xs font-bold text-gray-500 uppercase ml-1'>
                                      About
                                    </label>
                                    <Field
                                      name='about'
                                      as='textarea'
                                      rows={3}
                                      className='block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 transition-all resize-none dark:text-white'
                                      placeholder='A few words about yourself...'
                                    />
                                    <ErrorMessage
                                      name='about'
                                      component='p'
                                      className='text-xs text-red-500 font-medium ml-1'
                                    />
                                  </div>

                                  <div className='pt-2'>
                                    <button
                                      type='submit'
                                      disabled={!dirty || !isValid || isUpdatingAccount}
                                      className={classNames(
                                        'w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all',
                                        !dirty || !isValid || isUpdatingAccount
                                          ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-[0.98]',
                                      )}>
                                      {isUpdatingAccount ? (
                                        <span className='h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                                      ) : (
                                        'Save Changes'
                                      )}
                                    </button>
                                  </div>
                                </Form>
                              )}
                            </Formik>
                          </div>
                        </section>
                      </motion.div>
                    )}

                    {/* Appearance Section */}
                    {activeTab === 'appearance' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}>
                        <section>
                          <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1'>
                            Appearance
                          </h4>
                          <div className='flex justify-between w-full items-center rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border dark:border-gray-700/50'>
                            <div className='flex items-center gap-4'>
                              <div className='flex items-center justify-center h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'>
                                {activeMode ? (
                                  <MoonIcon className='h-6 w-6' />
                                ) : (
                                  <SunIcon className='h-6 w-6' />
                                )}
                              </div>
                              <div className='text-left'>
                                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                  Theme Mode
                                </h3>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                  {activeMode ? 'Dark Theme' : 'Light Theme'}
                                </p>
                              </div>
                            </div>
                            <ModeToggler />
                          </div>
                        </section>
                      </motion.div>
                    )}

                    {/* Account Section */}
                    {activeTab === 'account' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}>
                        <section className='space-y-6'>
                          <AnimatePresence mode='wait'>
                            {!activeSubTab ? (
                              <motion.div
                                key='account-menu'
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}>
                                <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1'>
                                  Account Settings
                                </h4>
                                <div className='space-y-3'>
                                  <div className='w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700/50'>
                                    <div className='flex items-center gap-4'>
                                      <div
                                        className={classNames(
                                          'p-2.5 rounded-lg',
                                          currentUser?.isEmailVerified
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                                        )}>
                                        {currentUser?.isEmailVerified ? (
                                          <CheckBadgeIcon className='h-5 w-5' />
                                        ) : (
                                          <EnvelopeIcon className='h-5 w-5' />
                                        )}
                                      </div>
                                      <div className='text-left'>
                                        <h3 className='text-sm font-bold text-gray-900 dark:text-white'>
                                          Email Status
                                        </h3>
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                          {currentUser?.isEmailVerified
                                            ? 'Your account is verified'
                                            : 'Please verify your email address'}
                                        </p>
                                      </div>
                                    </div>
                                    {!currentUser?.isEmailVerified && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await resendVerification().unwrap();
                                            toast.success(
                                              res.message || 'Verification email sent!',
                                            );
                                          } catch (error: any) {
                                            toast.error(
                                              error?.data?.message || 'Failed to resend email',
                                            );
                                          }
                                        }}
                                        disabled={isResending}
                                        className='text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50'>
                                        {isResending ? 'Sending...' : 'Resend'}
                                      </button>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => setActiveSubTab('password')}
                                    className='w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group'>
                                    <div className='flex items-center gap-4'>
                                      <div className='p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400'>
                                        <LockClosedIcon className='h-5 w-5' />
                                      </div>
                                      <div className='text-left'>
                                        <h3 className='text-sm font-bold text-gray-900 dark:text-white'>
                                          Change Password
                                        </h3>
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                          Update your account security
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRightIcon className='h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform' />
                                  </button>

                                  <button
                                    onClick={onLogout}
                                    className='w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-red-600'>
                                    <div className='flex items-center gap-4'>
                                      <div className='p-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg'>
                                        <PowerIcon className='h-5 w-5' />
                                      </div>
                                      <div className='text-left'>
                                        <h3 className='text-sm font-bold'>Sign Out</h3>
                                        <p className='text-xs text-red-500/70'>
                                          Log out of your current session
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRightIcon className='h-5 w-5 text-red-400 group-hover:translate-x-1 transition-transform' />
                                  </button>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key='password-form'
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}>
                                <div className='flex items-center gap-2 mb-4'>
                                  <button
                                    onClick={() => setActiveSubTab(null)}
                                    className='p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors'>
                                    <ArrowLeftIcon className='h-5 w-5' />
                                  </button>
                                  <h4 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                                    Update Password
                                  </h4>
                                </div>

                                <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700/50'>
                                  <div className='flex items-center gap-3 mb-6'>
                                    <div className='p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg'>
                                      <LockClosedIcon className='h-5 w-5 text-indigo-600 dark:text-indigo-400' />
                                    </div>
                                    <div>
                                      <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                                        New Password
                                      </h3>
                                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        Choose a strong password for your account.
                                      </p>
                                    </div>
                                  </div>

                                  <Formik
                                    initialValues={{
                                      existingPassword: '',
                                      newPassword: '',
                                      confirmNewPassword: '',
                                    }}
                                    validationSchema={changePasswordSchema}
                                    onSubmit={async (values, { resetForm }) => {
                                      try {
                                        await changePassword({
                                          existingPassword: values.existingPassword,
                                          newPassword: values.newPassword,
                                        }).unwrap();
                                        toast.success('Password changed successfully');
                                        resetForm();
                                        setActiveSubTab(null);
                                      } catch (error: any) {
                                        toast.error(
                                          error?.data?.message || 'Failed to change password',
                                        );
                                      }
                                    }}>
                                    {({ isValid, dirty }) => (
                                      <Form className='space-y-4'>
                                        {[
                                          'existingPassword',
                                          'newPassword',
                                          'confirmNewPassword',
                                        ].map((field) => (
                                          <div key={field} className='space-y-1'>
                                            <label
                                              htmlFor={field}
                                              className='block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1'>
                                              {field === 'existingPassword'
                                                ? 'Current Password'
                                                : field === 'newPassword'
                                                  ? 'New Password'
                                                  : 'Confirm New Password'}
                                            </label>
                                            <div className='relative group'>
                                              <Field
                                                name={field}
                                                type={showPasswords[field] ? 'text' : 'password'}
                                                className='block w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 transition-all dark:text-white'
                                              />
                                              <button
                                                type='button'
                                                onClick={() => togglePasswordVisibility(field)}
                                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'>
                                                {showPasswords[field] ? (
                                                  <EyeSlashIcon className='h-5 w-5' />
                                                ) : (
                                                  <EyeIcon className='h-5 w-5' />
                                                )}
                                              </button>
                                            </div>
                                            <ErrorMessage
                                              name={field}
                                              component='p'
                                              className='text-xs text-red-500 font-medium ml-1'
                                            />
                                          </div>
                                        ))}

                                        <div className='pt-2'>
                                          <button
                                            type='submit'
                                            disabled={!dirty || !isValid || isChangingPassword}
                                            className={classNames(
                                              'w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all',
                                              !dirty || !isValid || isChangingPassword
                                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-[0.98]',
                                            )}>
                                            {isChangingPassword ? (
                                              <span className='h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                                            ) : (
                                              'Save Change'
                                            )}
                                          </button>
                                        </div>
                                      </Form>
                                    )}
                                  </Formik>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <UserProfileModal
                    open={openProfile}
                    onClose={() => setOpenProfile(false)}
                    user={currentUser}
                    onLogout={onLogout}
                  />
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  );
};
