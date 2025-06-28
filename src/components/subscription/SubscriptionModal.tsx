import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Check, 
  X, 
  Zap, 
  Shield, 
  Star,
  CreditCard,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useStripe } from '../../hooks/useStripe';
import { STRIPE_PRODUCTS } from '../../stripe-config';
import toast from 'react-hot-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
}

export function SubscriptionModal({ isOpen, onClose, selectedPlan = 'prod_SaEOlOgANKu2QM' }: SubscriptionModalProps) {
  const { createCheckoutSession, loading, isProUser } = useStripe();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSubscribe = async (productId: string) => {
    const product = STRIPE_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      toast.error('Invalid product selected');
      return;
    }

    try {
      setProcessingPlan(productId);
      await createCheckoutSession(productId);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to start subscription process');
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFeatures = (productId: string) => {
    const product = STRIPE_PRODUCTS.find(p => p.id === productId);
    if (!product) return [];
    
    // Split description by commas and clean up
    return product.description.split(',').map(feature => feature.trim());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upgrade to MindPal Pro
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Unlock the full potential of MindPal with our Pro subscription
            </p>
          </div>

          {/* Stripe Configuration Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-1" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-300">Stripe Configuration Required</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  To enable payments, you need to create a <strong>recurring price</strong> in your Stripe dashboard. Go to Products → Create/Select Product → Add Price → Set billing to "Recurring" → Copy the Price ID and update it in stripe-config.ts.
                </p>
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className="max-w-md mx-auto">
            {STRIPE_PRODUCTS.map((product) => {
              const isProcessing = processingPlan === product.id;
              const features = getFeatures(product.id);

              return (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  className="relative rounded-2xl p-6 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
                >
                  {/* Popular Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Most Popular</span>
                    </div>
                  </div>

                  {/* Plan Header */}
                  <div className="text-center mb-6 mt-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <Check className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSubscribe(product.id)}
                    disabled={loading || isProcessing || isProUser()}
                    className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : isProUser() ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Current Plan</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Subscribe Now</span>
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 mt-8">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">Secure Payment</p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your payment is processed securely by Stripe. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl inline-block mb-3">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Instant Access</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get immediate access to all Pro features
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl inline-block mb-3">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Cancel Anytime</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No long-term commitment required
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl inline-block mb-3">
                <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Premium Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Priority customer support included
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              By subscribing, you agree to our{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}