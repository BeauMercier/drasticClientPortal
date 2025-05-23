import Link from 'next/link';
import { useNotifications, Notification } from '@/hooks/useNotifications'; // Assuming Notification type is exported
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Bell } from 'lucide-react'; // Added Bell import

interface GettingStartedPanelProps {
  actionable: Notification[]; // Changed prop name
}

export default function GettingStartedPanel({ actionable }: GettingStartedPanelProps) { // Changed prop name
  const { markAsRead } = useNotifications(); // Get markAsRead from the hook

  if (!actionable || actionable.length === 0) { // Changed prop name
    return null;
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
        Getting started
      </h2>

      <ul className="space-y-3">
        {actionable.map((n) => (
          <li
            key={n.id}
            className="
              flex items-start gap-3 rounded-md p-4
              bg-blue-100 hover:bg-blue-200
              dark:!bg-blue-800-70 dark:hover:!bg-blue-700-70
            "
          >
            <Bell className="mt-1 shrink-0 h-5 w-5 text-blue-600 dark:text-blue-400" />

            <div className="flex-1 dark:bg-transparent">
              <p className="font-medium text-gray-700 dark:!text-gray-100">
                {n.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {n.message}{' '}
                <Link
                  href={n.link ?? '/profile'}
                  onClick={() => handleNotificationClick(n)}
                  className="font-medium text-blue-600 hover:text-blue-800
                             dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Finish&nbsp;now&nbsp;→
                </Link>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 