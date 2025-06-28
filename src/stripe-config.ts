export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// NOTE: The product ID 'prod_SZo2DUxaaXJyE6' could not be found on Stripe
// Using a placeholder configuration for demo purposes
// You need to create this product in your Stripe dashboard first
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_demo_mindpal_pro',
    name: 'MindPal Pro',
    description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
    priceId: 'price_demo_199_inr_monthly',
    price: 199.00,
    currency: 'INR',
    mode: 'subscription'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};