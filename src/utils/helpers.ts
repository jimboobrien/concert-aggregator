/**
 * Helper functions that can be used across the application
 */

import { redirect } from "next/navigation";

export const getURL = () => {
  let url = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    process.env.NEXT_PUBLIC_VERCEL_URL || 
    'http://localhost:3000';
  
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  
  // Make sure to including trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  
  return url;
};

export function getErrorRedirect(
  path: string,
  errorType: string,
  errorMessage: string
) {
  const params = new URLSearchParams()
  params.set('error', errorType)
  params.set('error_description', errorMessage)
  return `${path}?${params.toString()}`
}

export function getStatusRedirect(
  path: string,
  status: string,
  message: string
) {
  const params = new URLSearchParams()
  params.set('status', status)
  params.set('message', message)
  return `${path}?${params.toString()}`
}

/**
 * Calculate the end date of a trial period based on the number of trial days
 */
export const calculateTrialEndUnixTimestamp = (
  trialPeriodDays?: number | null
) => {
  // If no trial period, return the current time
  if (!trialPeriodDays) {
    return undefined;
  }
  
  const currentDate = new Date();
  const trialEndDate = new Date(
    currentDate.getTime() + trialPeriodDays * 24 * 60 * 60 * 1000
  );
  
  // Return the Unix timestamp in seconds
  return Math.floor(trialEndDate.getTime() / 1000);
};

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
} 