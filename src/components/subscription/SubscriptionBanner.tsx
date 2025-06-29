import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Sparkles, Star, Zap } from 'lucide-react';
import { STRIPE_PRODUCTS } from '../../stripe-config';

interface SubscriptionBannerProps {
  onUpgrade: () => void;
  className?: string;
}

export function SubscriptionBanner({ onUpgrade, className = '' }: SubscriptionBannerProps) {
  const proProduct = STRIPE_PRODUCTS.find(p => p.id === 'prod_SaPj0MHJuPVFGC');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white ${className}`}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
      </div>

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute top-2 right-4"
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <Star className="h-6 w-6 text-yellow-300/50" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-2 left-4"
        animate={{ rotate: -360, y: [-2, 2, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Zap className="h-5 w-5 text-blue-300/50" />
      </motion.div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl relative"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Crown className="h-6 w-6" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </motion.div>
          </motion.div>
          <div>
            <motion.h3
              className="text-lg font-bold mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Subscribe to MindPal Pro
            </motion.h3>
            <motion.p
              className="text-white/90 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Monthly subscription for just ₹{proProduct?.price || 199}/month
            </motion.p>
          </div>
        </div>
        
        <motion.button
          onClick={onUpgrade}
          className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 border border-white/20 group overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Button Background Animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={false}
          />
          
          <div className="relative z-10 flex items-center space-x-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span>Subscribe Now</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </div>
        </motion.button>
      </div>

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}