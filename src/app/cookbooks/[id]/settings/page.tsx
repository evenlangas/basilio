'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import UserSearch from '@/components/UserSearch';
import { 
  IoArrowBack, 
  IoSave, 
  IoTrash, 
  IoLockClosed, 
  IoGlobe,
  IoPeople,
  IoAdd,
  IoClose
} from 'react-icons/io5';

interface Cookbook {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  invitedUsers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

export default function CookbookSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cookbookId, setCookbookId] = useState<string>('');
  const [pendingInvites, setPendingInvites] = useState<Array<{
    _id: string;
    recipient: {
      _id: string;
      name: string;
      email: string;
      image?: string;
    };
  }>>([]);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setCookbookId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !cookbookId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCookbook();
  }, [session, status, router, cookbookId]);

  const loadCookbook = async () => {
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}`);
      if (response.ok) {
        const data = await response.json();
        setCookbook(data);
        setName(data.name);
        setDescription(data.description || '');
        setIsPrivate(data.isPrivate);
        loadPendingInvites();
      } else if (response.status === 404) {
        router.push('/cookbooks');
      } else if (response.status === 403) {
        router.push(`/cookbooks/${cookbookId}`);
      }
    } catch (error) {
      console.error('Error loading cookbook:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/invite`);
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(data);
      }
    } catch (error) {
      console.error('Error loading pending invites:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isPrivate,
        }),
      });

      if (response.ok) {
        router.push(`/cookbooks/${cookbookId}`);
      } else {
        alert('Failed to update cookbook');
      }
    } catch (error) {
      console.error('Error updating cookbook:', error);
      alert('Failed to update cookbook');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (user: { _id: string; name: string; email: string }) => {
    setInviting(true);
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
        }),
      });

      if (response.ok) {
        alert(`Invitation sent to ${user.name}`);
        loadPendingInvites();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (notificationId: string, userName: string) => {
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/invite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
        }),
      });

      if (response.ok) {
        alert(`Invitation to ${userName} cancelled`);
        loadPendingInvites();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel invite');
      }
    } catch (error) {
      console.error('Error cancelling invite:', error);
      alert('Failed to cancel invite');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/invite`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (response.ok) {
        loadCookbook(); // Refresh to remove user from list
      } else {
        alert('Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this cookbook? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/cookbooks');
      } else {
        alert('Failed to delete cookbook');
      }
    } catch (error) {
      console.error('Error deleting cookbook:', error);
      alert('Failed to delete cookbook');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : cookbook ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
              >
                <IoArrowBack size={20} />
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Cookbook Settings
              </h1>
            </div>

            {/* Basic Settings */}
            <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cookbook Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-500)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                      e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-500)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Privacy Settings
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="private"
                        name="privacy"
                        checked={isPrivate}
                        onChange={() => setIsPrivate(true)}
                        className="h-4 w-4 border-gray-300 dark:border-gray-600"
                        style={{ accentColor: 'var(--color-primary-600)' }}
                      />
                      <label htmlFor="private" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <IoLockClosed size={16} />
                          <span className="font-medium">Private</span>
                        </div>
                        <span className="block text-gray-500 dark:text-gray-400 text-xs mt-1">Only you and invited users can see this cookbook</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="public"
                        name="privacy"
                        checked={!isPrivate}
                        onChange={() => setIsPrivate(false)}
                        className="h-4 w-4 border-gray-300 dark:border-gray-600"
                        style={{ accentColor: 'var(--color-primary-600)' }}
                      />
                      <label htmlFor="public" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <IoGlobe size={16} />
                          <span className="font-medium">Public</span>
                        </div>
                        <span className="block text-gray-500 dark:text-gray-400 text-xs mt-1">Anyone can discover and view this cookbook</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: 'var(--color-primary-600)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <IoSave size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Share Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoPeople size={20} />
                Share & Collaborate
              </h2>

              {/* Invite Form */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite Users
                </label>
                <UserSearch
                  onUserSelect={handleInvite}
                  placeholder="Search for users to invite..."
                  excludeUserIds={[
                    cookbook.createdBy._id, 
                    ...cookbook.invitedUsers.map(u => u._id),
                    ...pendingInvites.map(invite => invite.recipient._id)
                  ]}
                />
              </div>

              {/* Pending Invitations */}
              {pendingInvites.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Pending Invitations ({pendingInvites.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div key={invite._id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {invite.recipient.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {invite.recipient.email}
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Invitation pending
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelInvite(invite._id, invite.recipient.name)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Cancel invitation"
                        >
                          <IoClose size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invited Users */}
              {cookbook.invitedUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    People with access ({cookbook.invitedUsers.length})
                  </h3>
                  <div className="space-y-2">
                    {cookbook.invitedUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(user._id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Remove user"
                        >
                          <IoClose size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-red-500">
              <h2 className="text-lg font-semibold text-red-600 mb-4">
                Danger Zone
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Once you delete a cookbook, there is no going back. Please be certain.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <IoTrash size={18} />
                    Delete Cookbook
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Cookbook not found or access denied
            </p>
          </div>
        )}
      </main>
    </div>
  );
}