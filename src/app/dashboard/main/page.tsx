import DashboardClientPage from '../client-page';
import FollowedVenuesList from '../FollowedVenuesList';

export default async function DashboardPage() {
  return (
    <>
      <DashboardClientPage />
      <hr className="my-5" />
      <FollowedVenuesList />
    </>
  );
} 