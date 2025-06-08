import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="py-5 text-center">
      <h1 className="display-4">Welcome to Hometown Music Tracker</h1>
      <p className="lead">Your personalized guide to the local music scene.</p>
      <hr className="my-4" />
      <p>Track your favorite venues and artists, and never miss a show again.</p>
      <Link className="btn btn-primary btn-lg" href="/account" role="button">
        Go to Your Account
      </Link>
      <Link className="btn btn-secondary btn-lg ms-2" href="/login" role="button">
        Login
      </Link>
    </div>
  );
}
