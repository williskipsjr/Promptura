import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Check } from 'lucide-react';
import LayoutWrapper from '../components/LayoutWrapper';

const ProfilePage: React.FC = () => {
  const { currentUser, updateUserName } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.user_metadata?.full_name) {
      const nameParts = currentUser.user_metadata.full_name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await updateUserName(fullName);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <motion.div
            className="w-full max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="heading text-3xl md:text-4xl mb-4 text-text-primary">Profile</h1>

            {showSuccess && (
              <motion.div
                className="mb-4 glass p-3 rounded-lg border border-success-500/30 flex items-center gap-3 text-success-500"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Check className="h-5 w-5" />
                <p className="text-sm">User Profile Updated</p>
              </motion.div>
            )}

            <div className="glass rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-text-primary">
                    {currentUser?.user_metadata?.full_name || 'User'}
                  </h2>
                  <p className="text-sm text-text-secondary">Update your photo and personal details</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h3 className="text-base font-display font-bold text-text-primary">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field w-full"
                      placeholder="John"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field w-full"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={currentUser?.email || ''}
                      className="input-field bg-neutral-800 cursor-not-allowed opacity-60 w-full"
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={currentUser?.email?.split('@')[0] || ''}
                      className="input-field bg-neutral-800 cursor-not-allowed opacity-60 w-full"
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-neutral-500 mt-1">Username cannot be changed</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary px-6 py-2"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default ProfilePage;