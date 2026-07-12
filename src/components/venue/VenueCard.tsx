import Link from 'next/link';
import Image from 'next/image';
import { VenueListDto } from '@/lib/api-types';
import { Badge } from '@/components/ui/Badge';
import { formatEur } from '@/lib/utils';

interface VenueCardProps {
  venue: VenueListDto;
  explanation?: string;
  score?: number;
}

export function VenueCard({ venue, explanation, score }: VenueCardProps) {
  return (
    <Link href={`/venue/${venue.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
        {/* Photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
          {venue.firstPhotoUrl ? (
            <Image
              src={venue.firstPhotoUrl}
              alt={venue.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-300">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-neutral-900 leading-snug">{venue.name}</h3>
              <p className="text-sm text-neutral-500">{venue.neighbourhood} · {venue.sizeM2} m²</p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-neutral-900">
              {formatEur(venue.dayRateEur)}<span className="font-normal text-neutral-500">/day</span>
            </p>
          </div>

          {/* Tags */}
          {venue.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {venue.tags.slice(0, 4).map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
              {venue.tags.length > 4 && (
                <Badge>+{venue.tags.length - 4}</Badge>
              )}
            </div>
          )}

          {/* AI explanation */}
          {explanation && (
            <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-100 pt-3 mt-1">
              {explanation}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}