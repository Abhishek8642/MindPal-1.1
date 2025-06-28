export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// Updated for recurring subscription payment
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SaEOlOgANKu2QM',
    name: 'MindPal Pro',
    description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
    priceId: 'price_1Rf4SXP9u4ZhsDFEi5ZIUSUR', // Updated price ID for recurring payment
    price: 199, // ₹199/month recurring subscription
    currency: 'INR',
    mode: 'subscription' // Changed to subscription for recurring payment
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};