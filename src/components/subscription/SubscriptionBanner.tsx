import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Sparkles } from 'lucide-react';

interface SubscriptionBannerProps {
  onUpgrade: () => void;
  className?: string;
}

export function SubscriptionBanner({ onUpgrade, className = '' }: SubscriptionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Upgrade to MindPal Pro</h3>
            <p className="text-white/90 text-sm">
              Unlock unlimited features for just ₹199/month
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUpgrade}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 border border-white/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Upgrade Now</span>
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}