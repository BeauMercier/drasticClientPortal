'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth';
import { Card } from '../../shared/ui/molecules';
import { Button } from '../../shared/ui/atoms';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // Form state for profile
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    role: '',
    company: '',
    bio: ''
  });

  // Form state for password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update profile form when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.full_name || '',
        email: user.email || '',
        role: user.role || '',
        company: (user as any).user_metadata?.company || '',
        bio: (user as any).user_metadata?.bio || ''
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle profile save
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the user profile via API
    console.log('Profile data:', profileForm);
  };

  // Handle password save
  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the password via API
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Password updated');
  };

  // Handle preferences save
  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update preferences via API
    console.log('Preferences updated', { darkMode, emailNotifications });
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <Card className="bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                      activeTab === 'preferences'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab('preferences')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Preferences
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                      activeTab === 'security'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                      activeTab === 'notifications'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </button>
                </li>
              </ul>
            </nav>
          </Card>
        </div>

        {/* Settings content */}
        <div className="flex-1">
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
                <form onSubmit={handleProfileSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={profileForm.role}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={profileForm.company}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="primary" type="submit">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance & Preferences</h2>
                <form onSubmit={handlePreferencesSave}>
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Theme</h3>
                    <div className="flex items-center">
                      <label className="inline-flex items-center mr-6">
                        <input
                          type="radio"
                          className="form-radio h-5 w-5 text-blue-600"
                          name="theme"
                          checked={!darkMode}
                          onChange={() => setDarkMode(false)}
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Light</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-5 w-5 text-blue-600"
                          name="theme"
                          checked={darkMode}
                          onChange={() => setDarkMode(true)}
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Dark</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Notifications</h3>
                    <div className="space-y-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600"
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Email notifications
                        </span>
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 ml-7">
                        Receive email notifications about account activity, updates, and security alerts.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" type="submit">
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h2>
                
                <div className="mb-8">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordSave}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="primary" type="submit">
                        Update Password
                      </Button>
                    </div>
                  </form>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="secondary">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Email Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Project updates and changes
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          New file uploads
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Billing and payment notifications
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Marketing and promotional emails
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">In-App Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Project activity
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          File changes
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          Security alerts
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="primary">
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 