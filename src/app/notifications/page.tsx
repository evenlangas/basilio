'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { 
  IoCheckmark, 
  IoClose,
  IoNotifications,
  IoBook,
  IoCart,
  IoPersonCircle
} from 'react-icons/io5';

interface Notification {
  _id: string;
  sender: {
    _id: string;
    name: string;
    image?: string;
  };
  type: 'cookbook_invite' | 'shopping_list_invite' | 'follow_request';
  title: string;
  message: string;
  data: {
    cookbookId?: {
      _id: string;
      name: string;
    };
    shoppingListId?: {
      _id: string;
      name: string;
    };
  };
  read: boolean;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchNotifications();
  }, [session, status, router]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (notificationId: string, status: 'accepted' | 'declined') => {
    setResponding(notificationId);
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error responding to notification:', error);
    } finally {
      setResponding(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cookbook_invite':
        return <IoBook className="text-orange-500" size={20} />;
      case 'shopping_list_invite':
        return <IoCart className="text-green-500" size={20} />;
      case 'follow_request':
        return <IoPersonCircle className="text-blue-500" size={20} />;
      default:
        return <IoNotifications className="text-gray-500" size={20} />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with invites and requests
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <IoNotifications size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                  !notification.read 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {notification.message}
                    </p>
                    
                    {notification.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleResponse(notification._id, 'accepted')}
                          disabled={responding === notification._id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <IoCheckmark size={16} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleResponse(notification._id, 'declined')}
                          disabled={responding === notification._id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <IoClose size={16} />
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {notification.status === 'accepted' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <IoCheckmark size={16} />
                        <span className="text-sm font-medium">Accepted</span>
                      </div>
                    )}
                    
                    {notification.status === 'declined' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <IoClose size={16} />
                        <span className="text-sm font-medium">Declined</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}