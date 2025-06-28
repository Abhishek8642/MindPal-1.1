export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

// Empty products array - add your products here when ready
export const STRIPE_PRODUCTS: StripeProduct[] = [
  // Example product structure:
  // {
  //   id: 'your_product_id',
  //   name: 'MindPal Pro',
  //   description: 'Advanced AI personality customization, Extended mood analytics and insights, Priority support and early access to features, Family sharing and parental reports',
  //   priceId: 'your_price_id',
  //   price: 199,
  //   currency: 'INR',
  //   mode: 'subscription'
  // }
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
};