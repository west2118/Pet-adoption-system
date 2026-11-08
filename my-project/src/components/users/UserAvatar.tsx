import { cn } from '@/lib/utils';

const userInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'md' | 'lg' | 'xl';
}

/** Avatar with an initials fallback, shared by the user table and details modal. */
export const UserAvatar = ({ name, avatarUrl, size = 'md' }: UserAvatarProps) => {
  const sizeClass = size === 'xl' ? 'size-16' : size === 'lg' ? 'size-14' : 'size-10';
  const imageRounded =
    size === 'lg' ? 'rounded-full' : size === 'xl' ? 'rounded-xl' : 'rounded-lg';
  const fallbackRounded = size === 'xl' ? 'rounded-xl' : 'rounded-full';
  const textSize = size === 'xl' ? 'text-lg' : size === 'lg' ? 'text-base' : 'text-xs';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('shrink-0 object-cover', sizeClass, imageRounded)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-orange-100 font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300',
        sizeClass,
        fallbackRounded,
        textSize,
      )}
    >
      {userInitials(name)}
    </span>
  );
};
