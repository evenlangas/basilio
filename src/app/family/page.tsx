'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface FamilyMember {
  _id: string;
  name: string;
  email: string;
}

interface Family {
  _id: string;
  name: string;
  inviteCode: string;
  members: FamilyMember[];
}

export default function FamilyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [editFamilyName, setEditFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchFamily();
  }, [session, status, router]);

  const fetchFamily = async () => {
    try {
      const response = await fetch('/api/family');
      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
      }
    } catch (error) {
      console.error('Error fetching family:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!familyName.trim()) {
      setError('Family name is required');
      return;
    }

    try {
      const response = await fetch('/api/family/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: familyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
        setShowCreateForm(false);
        setFamilyName('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create family');
      }
    } catch (error) {
      setError('An error occurred');
    }
  };

  const joinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
        setShowJoinForm(false);
        setInviteCode('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join family');
      }
    } catch (error) {
      setError('An error occurred');
    }
  };

  const leaveFamily = async () => {
    if (!confirm('Are you sure you want to leave this family? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/family', {
        method: 'DELETE',
      });

      if (response.ok) {
        setFamily(null);
      } else {
        console.error('Failed to leave family');
      }
    } catch (error) {
      console.error('Error leaving family:', error);
    }
  };

  const editFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editFamilyName.trim()) {
      setError('Family name is required');
      return;
    }

    try {
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFamilyName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
        setShowEditForm(false);
        setEditFamilyName('');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update family name');
      }
    } catch (error) {
      setError('An error occurred while updating family name');
    }
  };

  const copyInviteCode = () => {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Family</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Share your recipes and shopping lists with family members
          </p>
        </div>

        {!family ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                You're not part of a family yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new family or join an existing one to start sharing recipes and shopping lists
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Create New Family</h4>
                
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Create Family
                  </button>
                ) : (
                  <form onSubmit={createFamily} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Family name"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    
                    {error && showCreateForm && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setFamilyName('');
                          setError('');
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Join Existing Family</h4>
                
                {!showJoinForm ? (
                  <button
                    onClick={() => setShowJoinForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Join Family
                  </button>
                ) : (
                  <form onSubmit={joinFamily} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    {error && showJoinForm && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Join
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowJoinForm(false);
                          setInviteCode('');
                          setError('');
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                {!showEditForm ? (
                  <div className="flex items-center space-x-3">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{family.name}</h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditForm(true);
                        setEditFamilyName(family.name);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Edit family name"
                    >
                      ✏️
                    </button>
                  </div>
                ) : (
                  <form onSubmit={editFamily} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Family name"
                        value={editFamilyName}
                        onChange={(e) => setEditFamilyName(e.target.value)}
                        className="text-2xl font-bold bg-transparent border-b-2 border-green-500 focus:outline-none focus:border-green-600 text-gray-900 dark:text-gray-100 pb-1"
                        autoFocus
                      />
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {family.members.length} member{family.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {error && showEditForm && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditForm(false);
                          setEditFamilyName('');
                          setError('');
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
              
              <div className="flex space-x-3">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Invite Code</div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">{family.inviteCode}</span>
                    <button
                      onClick={copyInviteCode}
                      className="text-green-600 hover:text-green-700"
                      title="Copy invite code"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Family Members</h3>
              <div className="space-y-3">
                {family.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{member.email}</div>
                    </div>
                    
                    {member._id === session.user.id && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <button
                onClick={leaveFamily}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Leave Family
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}