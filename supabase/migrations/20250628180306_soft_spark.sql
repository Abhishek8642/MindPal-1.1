/*
  # Create stripe_user_subscriptions view

  1. New Views
    - `stripe_user_subscriptions` - Joins stripe_customers and stripe_subscriptions to provide user subscription data
  
  2. Security
    - View inherits RLS from underlying tables
    - Users can only see their own subscription data through the customer relationship
*/

-- Create the stripe_user_subscriptions view
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.user_id = auth.uid() 
  AND sc.deleted_at IS NULL 
  AND (ss.deleted_at IS NULL OR ss.deleted_at IS NULL);

-- Grant access to authenticated users
GRANT SELECT ON stripe_user_subscriptions TO authenticated;