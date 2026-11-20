import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/** Mirrors the profile summary and the three read-only detail cards. */
export const ShelterProfileSkeleton = () => (
  <div role="status" aria-label="Loading shelter profile" className="space-y-4">
    <span className="sr-only">Loading shelter profile...</span>
    <div aria-hidden="true" className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center">
          <Skeleton className="size-20 shrink-0 rounded-xl motion-reduce:animate-none" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-52 max-w-full motion-reduce:animate-none" />
              <Skeleton className="h-5 w-28 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full motion-reduce:animate-none" />
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[40, 32, 36].map((width) => (
                <Skeleton key={width} style={{ width: `${width * 4}px` }} className="h-3 max-w-full motion-reduce:animate-none" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {[
        { name: 'Organization', fields: [false, false, true] },
        { name: 'Contact and hours', fields: [false, false, true] },
        { name: 'Public profile', fields: [true, true] },
      ].map(({ name, fields }) => (
        <Card key={name}>
          <CardHeader>
            <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-80 max-w-full motion-reduce:animate-none" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {fields.map((full, index) => (
              <div key={index} className={full ? 'sm:col-span-2' : undefined}>
                <Skeleton className="mb-1.5 h-5 w-28 motion-reduce:animate-none" />
                <Skeleton className={`h-4 max-w-full motion-reduce:animate-none ${full ? 'w-96' : 'w-48'}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
