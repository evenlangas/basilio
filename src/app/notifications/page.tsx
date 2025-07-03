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
  IoPersonCircle,
  IoChatbubbleOutline
} from 'react-icons/io5';
import { FaGrinHearts } from 'react-icons/fa';

interface Notification {
  _id: string;
  sender: {
    _id: string;
    name: string;
    image?: string;
  };
  type: 'cookbook_invite' | 'shopping_list_invite' | 'follow_request' | 'comment' | 'yum';
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
    creationId?: {
      _id: string;
      title: string;
    };
    commentId?: string;
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.type === 'comment' && notification.data.creationId) {
      router.push(`/creations/${notification.data.creationId._id}`);
    } else if (notification.type === 'yum' && notification.data.creationId) {
      router.push(`/creations/${notification.data.creationId._id}`);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 24) {
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cookbook_invite':
        return <IoBook className="text-green-500" size={20} />;
      case 'shopping_list_invite':
        return <IoCart className="text-green-500" size={20} />;
      case 'follow_request':
        return <IoPersonCircle className="text-green-500" size={20} />;
      case 'comment':
        return <IoChatbubbleOutline className="text-green-500" size={20} />;
      case 'yum':
        return <FaGrinHearts className="text-green-500" size={20} />;
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
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${
                  !notification.read 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                    : 'border-gray-200 dark:border-gray-700'
                } ${(notification.type === 'comment' || notification.type === 'yum') ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Show header for all notification types */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {notification.type === 'comment' && 'New Comment'}
                        {notification.type === 'yum' && 'New Yum'}
                        {(notification.type === 'cookbook_invite' || notification.type === 'shopping_list_invite' || notification.type === 'follow_request') && notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {notification.message}
                    </p>
                    
                    {/* Show approve/decline buttons only for invite-type notifications */}
                    {(notification.type === 'cookbook_invite' || notification.type === 'shopping_list_invite' || notification.type === 'follow_request') && notification.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResponse(notification._id, 'accepted');
                          }}
                          disabled={responding === notification._id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                        >
                          <IoCheckmark size={14} />
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResponse(notification._id, 'declined');
                          }}
                          disabled={responding === notification._id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                        >
                          <IoClose size={14} />
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {(notification.type === 'cookbook_invite' || notification.type === 'shopping_list_invite' || notification.type === 'follow_request') && notification.status === 'accepted' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <IoCheckmark size={14} />
                        <span className="text-xs font-medium">Accepted</span>
                      </div>
                    )}
                    
                    {(notification.type === 'cookbook_invite' || notification.type === 'shopping_list_invite' || notification.type === 'follow_request') && notification.status === 'declined' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <IoClose size={14} />
                        <span className="text-xs font-medium">Declined</span>
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