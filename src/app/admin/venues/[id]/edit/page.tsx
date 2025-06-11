import React from 'react';
import { Metadata } from 'next';

// Define params interface for Next.js 15
interface PageParams {
  id: string;
}

// Function to generate metadata with correct params handling
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  
  return {
    title: `Edit Venue: ${resolvedParams.id}`,
  };
}

// Page component with correct params type - async to handle Promise params
export default async function EditVenuesPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // Await the params Promise
  const resolvedParams = await params;
  
  return (
    <div className="container mt-4">
      <h1>Edit Venues: {resolvedParams.id}</h1>
      <p>This is the form to edit an item in venues.</p>
      {/* Add form component here */}
    </div>
  );
}
