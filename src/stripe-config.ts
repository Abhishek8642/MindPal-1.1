export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// IMPORTANT: Replace 'price_demo_recurring_monthly' with your actual recurring price ID from Stripe
// To create a recurring price:
// 1. Go to your Stripe Dashboard
// 2. Navigate to Products
// 3. Create or select a product
// 4. Add a new price with "Recurring" billing
// 5. Set the interval to "Monthly" or "Yearly"
// 6. Copy the Price ID and replace the demo value below
export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_SaEOlOgANKu2QM',
    name: 'MindPal Pro',
    description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
    priceId: 'price_demo_recurring_monthly', // Replace with your actual recurring price ID
    price: 1.00,
    currency: 'USD',
    mode: 'subscription'
  }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};