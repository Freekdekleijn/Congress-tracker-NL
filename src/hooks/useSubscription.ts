import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SubscriptionStatus {
  isActive: boolean;
  isLoading: boolean;
  status: string | null;
  customerId: string | null;
}

export function useSubscription(userId: string | undefined): SubscriptionStatus {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .maybeSingle();

        if (!customer?.customer_id) {
          setIsActive(false);
          setIsLoading(false);
          return;
        }

        setCustomerId(customer.customer_id);

        const { data: subscription } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customer.customer_id)
          .maybeSingle();

        if (subscription) {
          setStatus(subscription.status);
          setIsActive(subscription.status === 'active' || subscription.status === 'trialing');
        } else {
          setIsActive(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [userId]);

  return { isActive, isLoading, status, customerId };
}
