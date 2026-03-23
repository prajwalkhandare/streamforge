import React, { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
  });
  const [watchHistory, setWatchHistory] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await userService.getProfile();
        setProfile(data.data.user);
        setFormData({
          fullName: data.data.user.full_name || '',
          bio: data.data.user.bio || '',
        });
        
        const history = await userService.getWatchHistory();
        setWatchHistory(history.data?.history || []);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      await userService.updateProfile(formData);
      setProfile({ ...profile, full_name: formData.fullName, bio: formData.bio });
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <img 
              src={profile?.avatar_url || 'https://via.placeholder.com/100'} 
              alt={profile?.username}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h1 className="text-white text-2xl font-bold">{profile?.username}</h1>
              <p className="text-gray-400">{profile?.email}</p>
            </div>
          </div>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-white block mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                />
              </div>
              <div>
                <label className="text-white block mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile}>Save</Button>
                <Button onClick={() => setEditing(false)} variant="secondary">Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300"><span className="text-gray-500">Full Name:</span> {profile?.full_name || 'Not set'}</p>
              <p className="text-gray-300 mt-2"><span className="text-gray-500">Bio:</span> {profile?.bio || 'No bio added'}</p>
              <Button onClick={() => setEditing(true)} variant="secondary" className="mt-4">Edit Profile</Button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-white text-xl font-bold mb-4">Watch History</h2>
          {watchHistory.length === 0 ? (
            <p className="text-gray-400">No watch history yet</p>
          ) : (
            <div className="space-y-3">
              {watchHistory.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded">
                  <img src={item.thumbnail_url} alt={item.title} className="w-16 h-12 object-cover rounded" />
                  <div>
                    <p className="text-white">{item.title}</p>
                    <p className="text-gray-400 text-sm">Watched on {new Date(item.watched_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;