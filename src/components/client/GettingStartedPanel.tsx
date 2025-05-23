import Link from 'next/link';
import { Notification } from '@/hooks/useNotifications'; // Assuming Notification type is exported
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface GettingStartedPanelProps {
  actionableNotifications: Notification[];
}

export default function GettingStartedPanel({ actionableNotifications }: GettingStartedPanelProps) {
  if (!actionableNotifications || actionableNotifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Getting Started</h2>
      <ul className="space-y-3">
        {actionableNotifications.map((notification) => (
          <li key={notification.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
            <div>
              <p className="font-medium text-gray-700">{notification.title}</p>
              <p className="text-sm text-gray-500">{notification.message}</p>
            </div>
            {notification.link && (
              <Link href={notification.link} className="ml-4 p-2 text-blue-600 hover:text-blue-800">
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
} 