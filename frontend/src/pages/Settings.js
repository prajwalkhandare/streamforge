import React, { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    contentLanguage: 'english',
    autoplay: true,
    subtitles: true,
    quality: 'auto',
    notifications: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await userService.getPreferences();
        setPreferences(data.data?.preferences || {});
      } catch (error) {
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    try {
      await userService.updatePreferences(preferences);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="bg-dark min-h-screen pt-24 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">Settings</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-white text-xl font-bold mb-4">Playback Settings</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Auto-play next episode</label>
                <button
                  onClick={() => setPreferences({ ...preferences, autoplay: !preferences.autoplay })}
                  className={`w-12 h-6 rounded-full transition ${preferences.autoplay ? 'bg-primary' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition transform ${preferences.autoplay ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <label className="text-gray-300">Show subtitles by default</label>
                <button
                  onClick={() => setPreferences({ ...preferences, subtitles: !preferences.subtitles })}
                  className={`w-12 h-6 rounded-full transition ${preferences.subtitles ? 'bg-primary' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition transform ${preferences.subtitles ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div>
                <label className="text-gray-300 block mb-2">Default Video Quality</label>
                <select
                  value={preferences.quality}
                  onChange={(e) => setPreferences({ ...preferences, quality: e.target.value })}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                >
                  <option value="auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-white text-xl font-bold mb-4">Language</h2>
            <select
              value={preferences.contentLanguage}
              onChange={(e) => setPreferences({ ...preferences, contentLanguage: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="tamil">Tamil</option>
              <option value="telugu">Telugu</option>
            </select>
          </div>
          
          <div>
            <h2 className="text-white text-xl font-bold mb-4">Notifications</h2>
            <div className="flex justify-between items-center">
              <label className="text-gray-300">Email notifications for new content</label>
              <button
                onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                className={`w-12 h-6 rounded-full transition ${preferences.notifications ? 'bg-primary' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition transform ${preferences.notifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
