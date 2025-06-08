import DashboardClientPage from './client-page';
import FollowedVenuesList from './FollowedVenuesList';

export default async function DashboardPage() {
  return (
    <div className="container py-5">
      <h1 className="mb-4">API Test Dashboard</h1>
      <p className="lead mb-4">
        Use this dashboard to test the scraping functionality. Enter a URL and click &quot;Scrape&quot; to see the results.
      </p>
      <DashboardClientPage />
      <hr className="my-5" />
      <FollowedVenuesList />
    </div>
  );
} 