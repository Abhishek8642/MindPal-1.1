export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// Updated with your actual Stripe Price ID
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SaEOlOgANKu2QM',
    name: 'MindPal Pro',
    description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
    priceId: 'price_1Rf3vbP9u4ZhsDFE4NWkQWdQ',
    price: 1.00, // Updated to match your test amount
    currency: 'USD', // Updated to USD (Stripe's default for test mode)
    mode: 'subscription'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};