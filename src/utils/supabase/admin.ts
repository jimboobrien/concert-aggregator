import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/utils/stripe';
import Stripe from 'stripe';

export async function createOrRetrieveCustomer({
  uuid,
  email
}: {
  uuid: string;
  email: string;
}): Promise<string> {
  // Check if the customer already exists in our database
  const supabase = await createClient();
  const { data: existingCustomer, error } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('user_id', uuid)
    .maybeSingle();

  if (error) {
    console.error('Error retrieving customer from database:', error);
  }

  // If we have a Stripe customer ID, return it
  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  // Otherwise, create a new customer in Stripe
  const customerData: Stripe.CustomerCreateParams = {
    metadata: {
      supabaseUUID: uuid
    }
  };

  if (email) {
    customerData.email = email;
  }

  // Create new customer in Stripe
  const customer = await stripe.customers.create(customerData);

  // Store customer in our database
  const { error: insertError } = await supabase
    .from('customers')
    .insert([
      {
        user_id: uuid,
        stripe_customer_id: customer.id
      }
    ]);

  if (insertError) {
    console.error('Error inserting customer into database:', insertError);
  }

  return customer.id;
} 