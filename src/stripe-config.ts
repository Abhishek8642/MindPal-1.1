export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// Updated with your actual Stripe Price ID for one-time payment
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SaEOlOgANKu2QM',
    name: 'MindPal Pro',
    description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
    priceId: 'price_1Rf3vbP9u4ZhsDFE4NWkQWdQ', // Your actual one-time payment price ID
    price: 1.00,
    currency: 'USD',
    mode: 'payment' // Changed to 'payment' for one-time payment
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};