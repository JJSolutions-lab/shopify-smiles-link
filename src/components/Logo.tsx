import logoAsset from "@/assets/elegantero-logo.png.asset.json";
import { Link } from "@tanstack/react-router";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Link to="/" className="inline-flex items-center" aria-label="Elegantero home">
      <img src={logoAsset.url} alt="Elegantero" className={className} />
    </Link>
  );
}
