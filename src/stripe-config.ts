export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// Updated with proper minimum charge amount for Stripe
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SaEOlOgANKu2QM',
    name: 'MindPal Pro',
    description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
    priceId: 'price_1Rf4SXP9u4ZhsDFEi5ZIUSUR', // Updated price ID
    price: 199, // Changed from ₹1 to ₹199 to meet Stripe's minimum charge requirement
    currency: 'INR',
    mode: 'payment' // One-time payment
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};