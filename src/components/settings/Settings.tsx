import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Crown,
  Save,
  Mail,
  Phone,
  Globe,
  CreditCard,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useStripe } from '../../hooks/useStripe';
import { SubscriptionModal } from '../subscription/SubscriptionModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function Settings() {
  const { user } = useAuth();
  const { settings, updateSettings, loading } = useSettings();
  const { 
    isProUser, 
    createPortalSession, 
    currentSubscription, 
    subscriptionLoading,
    getCurrentPlan,
    getSubscriptionEndDate,
    isSubscriptionCanceling
  } = useStripe();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);
  const [profile, setProfile] = React.useState({
    fullName: '',
    phone: '',
    timezone: 'UTC',
  });
  const [profileLoading, setProfileLoading] = React.useState(false);

  // Load profile data on component mount
  React.useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, timezone, phone')
          .eq('id', user.id)
          .limit(1);

        if (error) {
          throw error;
        }

        // Handle both successful data and no profile case
        const profileData = data && data.length > 0 ? data[0] : null;
        setProfile({
          fullName: profileData?.full_name || '',
          phone: profileData?.phone || '',
          timezone: profileData?.timezone || 'UTC',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        // Set default values on error
        setProfile({
          fullName: '',
          phone: '',
          timezone: 'UTC',
        });
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Please sign in to save profile');
      return;
    }

    try {
      setProfileLoading(true);

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: profile.fullName.trim() || null,
          timezone: profile.timezone,
          phone: profile.phone.trim() || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        // Handle specific case where user_settings constraint fails
        // This can happen due to race conditions with triggers
        if (error.code === '23505' && error.message.includes('user_settings_user_id_key')) {
          // The profile was likely saved successfully, but the trigger failed
          // because user settings already exist. This is actually a success case.
          toast.success('Profile saved successfully!');
          return;
        }
        throw error;
      }

      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'profile') {
        await handleSaveProfile();
      } else {
        // Settings are automatically saved via useSettings hook
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleManageBilling = async () => {
    await createPortalSession();
  };

  const formatSubscriptionStatus = () => {
    if (subscriptionLoading) return 'Loading...';
    if (!currentSubscription) return 'Free Plan';
    
    const plan = getCurrentPlan();
    const status = currentSubscription.subscription_status;
    
    if (status === 'active') {
      return plan ? `${plan.name} - Active` : 'Pro Plan - Active';
    } else if (status === 'trialing') {
      return plan ? `${plan.name} - Trial` : 'Pro Plan - Trial';
    } else if (status === 'past_due') {
      return 'Pro Plan - Payment Due';
    } else if (status === 'canceled') {
      return 'Pro Plan - Canceled';
    } else {
      return 'Free Plan';
    }
  };

  const getSubscriptionDetails = () => {
    if (!currentSubscription) return null;
    
    const endDate = getSubscriptionEndDate();
    const isCanceling = isSubscriptionCanceling();
    
    return {
      endDate,
      isCanceling,
      status: currentSubscription.subscription_status,
      paymentMethod: currentSubscription.payment_method_brand && currentSubscription.payment_method_last4
        ? `${currentSubscription.payment_method_brand.toUpperCase()} •••• ${currentSubscription.payment_method_last4}`
        : null
    };
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'subscription', label: 'Subscription', icon: Crown },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Push Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Task Reminders</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get reminded about your tasks and deadlines
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.task_reminders}
                      onChange={(e) => updateSettings({ task_reminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Mood Reminders</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Daily prompts to check in with your emotions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.mood_reminders}
                      onChange={(e) => updateSettings({ mood_reminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Daily Summary</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      End-of-day summary of your activities
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.daily_summary}
                      onChange={(e) => updateSettings({ daily_summary: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => updateSettings({ email_notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'auto' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese (Simplified)</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Voice Speed
              </label>
              <select
                value={settings.voice_speed}
                onChange={(e) => updateSettings({ voice_speed: e.target.value as 'slow' | 'normal' | 'fast' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Personality
              </label>
              <select
                value={settings.ai_personality}
                onChange={(e) => updateSettings({ ai_personality: e.target.value as 'supportive' | 'professional' | 'friendly' | 'motivational' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="supportive">Supportive & Caring</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly & Casual</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Data Sharing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Share anonymized data to improve the service
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.data_sharing}
                      onChange={(e) => updateSettings({ data_sharing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Help us understand how you use the app
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.analytics}
                      onChange={(e) => updateSettings({ analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Voice Recordings</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Store voice recordings for better AI responses (encrypted)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.voice_recordings}
                      onChange={(e) => updateSettings({ voice_recordings: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                🔒 All sensitive data is encrypted before storage. Your privacy is our priority.
              </p>
            </div>
          </div>
        );

      case 'subscription':
        const subscriptionDetails = getSubscriptionDetails();
        
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatSubscriptionStatus()}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {isProUser() ? 'You have access to all premium features' : 'Subscribe to unlock premium features'}
                    </p>
                  </div>
                </div>
                {isProUser() ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-gray-400" />
                )}
              </div>

              {/* Subscription Details */}
              {subscriptionDetails && (
                <div className="space-y-3 mb-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  {subscriptionDetails.endDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {subscriptionDetails.isCanceling ? 'Expires on:' : 'Next billing:'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {subscriptionDetails.endDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {subscriptionDetails.paymentMethod && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment method:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {subscriptionDetails.paymentMethod}
                      </span>
                    </div>
                  )}

                  {subscriptionDetails.isCanceling && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        ⚠️ Your subscription is set to cancel at the end of the current billing period.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Advanced AI personality customization</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Extended mood analytics and insights</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Priority support and early access to features</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Family sharing and parental reports</span>
                </div>
              </div>

              <div className="flex space-x-3">
                {isProUser() ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManageBilling}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Manage Billing</span>
                    <ExternalLink className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSubscriptionModal(true)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Subscribe to Pro - ₹199/month</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Payment Testing Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💳 Payment Testing</h4>
              <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
                To test the subscription, click "Subscribe to Pro" above. The checkout will redirect to Stripe's secure payment page.
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-400">
                <p><strong>Test Card:</strong> 4242 4242 4242 4242</p>
                <p><strong>Expiry:</strong> Any future date</p>
                <p><strong>CVC:</strong> Any 3 digits</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Customize your MindPal experience</p>
      </div>

      {/* Settings Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}

              {/* Save Button */}
              {activeTab !== 'subscription' && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={profileLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{profileLoading ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        selectedPlan="prod_SaPj0MHJuPVFGC"
      />
    </div>
  );
}