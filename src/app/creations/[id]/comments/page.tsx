'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import { IoArrowBack, IoTimeOutline, IoSendOutline, IoEllipsisVertical, IoCheckmarkOutline, IoCloseOutline, IoCreateOutline, IoTrashOutline, IoAddOutline, IoChatbubbleOutline } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  chefName?: string;
  createdAt: string;
}

export default function CommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = use(params);
  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [updatingComment, setUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [showMenuForComment, setShowMenuForComment] = useState<string | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCreation();
    loadComments();
  }, [session, status, router, id]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenuForComment(null);
    };

    if (showMenuForComment) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenuForComment]);

  const loadCreation = async () => {
    try {
      const response = await fetch(`/api/creations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCreation(data);
      } else if (response.status === 404) {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading creation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/creations/${id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/creations/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
        setShowCommentInput(false);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentionSuggestions) {
      e.preventDefault();
      handleSubmitComment();
    }
    if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setMentionSuggestions([]);
      setShowMentionSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const users = await response.json();
        setMentionSuggestions(users);
        setShowMentionSuggestions(users.length > 0);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      searchUsers(query);
    } else {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
    }
  };

  const insertMention = (user: User) => {
    const cursorPosition = document.querySelector('textarea')?.selectionStart || 0;
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    
    // Find the @ symbol and replace the partial mention
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const mentionStart = textBeforeCursor.lastIndexOf('@');
      const newText = 
        newComment.substring(0, mentionStart) + 
        `@${user.name} ` + 
        textAfterCursor;
      
      setNewComment(newText);
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
      
      // Focus back to textarea
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          const newCursorPosition = mentionStart + user.name.length + 2;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          textarea.focus();
        }
      }, 0);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
    setShowMenuForComment(null);
  };

  const toggleCommentMenu = (commentId: string) => {
    setShowMenuForComment(prev => prev === commentId ? null : commentId);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim() || updatingComment) return;

    setUpdatingComment(true);
    try {
      const response = await fetch(`/api/creations/${id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: editCommentText.trim() }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => prev.map(comment => 
          comment._id === commentId ? updatedComment : comment
        ));
        setEditingCommentId(null);
        setEditCommentText('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/creations/${id}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (status === 'loading' || loading) {
    return <PageLoadingSkeleton />;
  }

  if (!session || !creation) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <IoArrowBack size={20} />
            <span>Back to Creation</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Simple Creation Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {creation.title}
            </h1>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">By:</span> {creation.createdBy.name}
              </div>
              {creation.chefName && (
                <div>
                  <span className="font-medium">Chef:</span> <ChefDisplay chefName={creation.chefName} />
                </div>
              )}
              <div>
                <span className="font-medium">Date:</span> {new Date(creation.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comments ({comments.length})
              </h2>
              <Link
                href={`/creations/${id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Creation
              </Link>
            </div>


            {/* Comments List */}
            <div className="space-y-4">
              {loadingComments ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isOwner = comment.user._id === session?.user?.id;
                  const isEditing = editingCommentId === comment._id;
                  const isDeleting = deletingCommentId === comment._id;

                  return (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {comment.user.image ? (
                          <img 
                            src={comment.user.image} 
                            alt={comment.user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 relative">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/profile/${comment.user._id}`}
                                className="font-semibold text-sm hover:underline block"
                                style={{ color: 'var(--color-primary-600)' }}
                              >
                                {comment.user.name}
                              </Link>
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {comment.updatedAt && new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 5000 && (
                                  <span className="ml-1">(edited)</span>
                                )}
                              </span>
                            </div>
                            
                            {isOwner && !isEditing && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCommentMenu(comment._id);
                                  }}
                                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  title="Comment options"
                                >
                                  <IoEllipsisVertical size={14} />
                                </button>
                                
                                {showMenuForComment === comment._id && (
                                  <div 
                                    className="absolute right-0 top-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50 min-w-[100px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => handleEditComment(comment)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <IoCreateOutline size={12} />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment._id)}
                                      disabled={isDeleting}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                                    >
                                      <IoTrashOutline size={12} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
                                rows={2}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateComment(comment._id)}
                                  disabled={!editCommentText.trim() || updatingComment}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-white rounded transition-colors disabled:opacity-50"
                                  style={{ backgroundColor: editCommentText.trim() ? 'var(--color-primary-600)' : '#9CA3AF' }}
                                >
                                  <IoCheckmarkOutline size={12} />
                                  {updatingComment ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                  <IoCloseOutline size={12} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                              <UserMentions text={comment.text} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Floating Comment Button */}
        {!showCommentInput && (
          <button
            onClick={() => setShowCommentInput(true)}
            className="fixed bottom-20 right-6 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
            style={{ 
              backgroundColor: 'var(--color-primary-600)',
              ':hover': { backgroundColor: 'var(--color-primary-700)' }
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
          >
            <IoChatbubbleOutline size={24} />
          </button>
        )}

        {/* Expandable Comment Input */}
        {showCommentInput && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'You'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                      {(session?.user?.name || 'You').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Write a comment... (Use @username to mention someone, Press Enter to post)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  
                  {/* Mention Suggestions Dropdown */}
                  {showMentionSuggestions && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                      {mentionSuggestions.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => insertMention(user)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            {user.image ? (
                              <img 
                                src={user.image} 
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            @{user.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={() => {
                        setShowCommentInput(false);
                        setNewComment('');
                        setShowMentionSuggestions(false);
                        setMentionSuggestions([]);
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-400">Use @username to mention • Press Enter to post</span>
                      <button
                        onClick={() => handleSubmitComment()}
                        disabled={!newComment.trim() || submittingComment}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: newComment.trim() ? 'var(--color-primary-600)' : '#9CA3AF' }}
                      >
                        <IoSendOutline size={16} />
                        {submittingComment ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}