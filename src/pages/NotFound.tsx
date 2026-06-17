import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="grid place-items-center min-h-[60vh] text-center">
      <div>
        <div className="text-6xl font-black mb-3">404</div>
        <p className="text-sub mb-6">We couldn't find that page. The track may have been moved.</p>
        <Link to="/" className="bg-accent text-black font-bold rounded-full px-6 py-3">Back to Home</Link>
      </div>
    </div>
  );
}
