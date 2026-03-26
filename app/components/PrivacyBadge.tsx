export function PrivacyBadge() {
  return (
    <div className="bg-shield-card border border-shield-accent/20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-shield-accent shrink-0" />
        <div>
          <p className="text-sm font-medium text-shield-accent">
            MEV Protected
          </p>
          <p className="text-xs text-shield-muted mt-0.5">
            Orders sealed in batch auctions on Initia MiniEVM. Uniform clearing
            price eliminates frontrunning.
          </p>
        </div>
      </div>
    </div>
  );
}
