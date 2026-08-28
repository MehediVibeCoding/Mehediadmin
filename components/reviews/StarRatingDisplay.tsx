export default function StarRatingDisplay({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${r} এর মধ্যে ৫ স্টার`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill={i < r ? '#F59E0B' : 'none'}
          stroke={i < r ? '#F59E0B' : '#D1D5DB'}
          strokeWidth="1.5"
        >
          <polygon points="12 2.5 15.09 8.76 22 9.77 17 14.64 18.18 21.52 12 18.25 5.82 21.52 7 14.64 2 9.77 8.91 8.76 12 2.5" />
        </svg>
      ))}
    </div>
  );
}
