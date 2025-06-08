import { stripe } from './config';

export const monthlyPrice = async () => {
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1500,
    recurring: {
      interval: 'month',
    },
    product_data: {
      name: '$15 Monthly',
    },
  });
  console.log("===price===", price);
  return price;
};

export const yearlyPrice = async () => {
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 12000,
    recurring: {
      interval: 'year',
    },
    product_data: {
      name: '$120 Yearly',
    },
  });
  console.log("===price===", price);
  return price;
};

// Get prices from Stripe dashboard instead of creating them dynamically
export const getStaticPrices = () => {
  return {
    monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    yearly: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID
  };
}; 