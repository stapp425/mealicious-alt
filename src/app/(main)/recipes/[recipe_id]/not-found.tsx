import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>Recipe was not found!</h1>
      <Link href="/dashboard">
        Go back to dashboard
      </Link>
    </div>
  );
}