import Stripe from 'stripe';
import { stripe } from './config';

export const createCustomer = async (user: { name?: string; email?: string }) => {
  const params: Stripe.CustomerCreateParams = {
    name: user?.name,
    email: user?.email,
    description: 'QBU app customer',
  };

  const customer: Stripe.Customer = await stripe.customers.create(params);
  return customer;
}; 