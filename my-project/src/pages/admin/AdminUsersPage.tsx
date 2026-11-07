import { Eye, Pencil, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import {
  DebouncedSearchInput,
  DetailsModal,
  RecordCard,
  RefreshButton,
  RecordCardSkeleton,
  SectionHeader,
  SlideOver,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/Form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useShelters } from '@/hooks/useData';
import { describeApiError } from '@/utils/errors';
import { listUsersPaginated, userService } from '@/services/api';
import type { User, UserRole } from '@/types';
import { ApiError } from '@/lib/apiClient';

const roleBadgeVariant = (role: UserRole) => {
  if (role === 'platform_admin') return 'destructive';
  if (role === 'shelter_staff') return 'info';
  return 'muted';
};

const userInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const AdminUsersPage = () => {
  const { shelters } = useShelters();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userQuery, setUserQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userSlideOpen, setUserSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{ role: UserRole; shelterId: string }>({
    role: 'adopter',
    shelterId: '',
  });

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const shelterName = (id: string) => shelters.find((s) => s.id === id)?.name ?? 'Unknown';

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await listUsersPaginated({
        page: userPage,
        limit: userPageSize,
        search: userQuery.trim(),
      });
      setUsersList(res.items);
      setTotalUsers(res.total);
      setUsersError(null);
    } catch (err) {
      setUsersError(describeApiError(err, 'Failed to load users. Please try again.'));
    } finally {
      setLoadingUsers(false);
    }
  }, [userPage, userPageSize, userQuery]);

  useEffect(() => {
    // Initial fetch and dependency-driven updates
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setDetailsUser(null);
    setUserForm({ role: user.role, shelterId: user.shelterId ?? '' });
    setUserSlideOpen(true);
  };

  const closeUserSlide = () => {
    setUserSlideOpen(false);
    setEditingUser(null);
  };

  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const shelterId =
        userForm.role === 'shelter_staff' && userForm.shelterId
          ? userForm.shelterId
          : undefined;
      const updated = await userService.updateRole(editingUser.id, userForm.role, shelterId);
      toast.success(`${updated.name}'s role updated successfully!`);
      closeUserSlide();
      await fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update role. Please try again.',
      );
    }
  };

  const setUserField = (key: keyof typeof userForm, value: string) =>
    setUserForm((prev) => ({ ...prev, [key]: value }));

  const userSearchFilter = (
    <DebouncedSearchInput
      value={userQuery}
      onDebouncedChange={(val) => {
        setLoadingUsers(true);
        setUserQuery(val);
        setUserPage(1);
      }}
      placeholder="Search users by name or email"
      className="w-full sm:w-[260px]"
      wrapperClassName="sm:w-[260px]"
    />
  );

  const userPagination =
    totalUsers > 0 ? (
      <TablePagination
        currentPage={userPage}
        totalItems={totalUsers}
        pageSize={userPageSize}
        onPageChange={(next) => {
          setLoadingUsers(true);
          setUserPage(next);
        }}
        onPageSizeChange={(newSize) => {
          setLoadingUsers(true);
          setUserPageSize(newSize);
          setUserPage(1);
        }}
        label="users"
      />
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="User accounts"
        subtitle="Manage adopters, shelter staff, and platform administrative accounts."
        actions={<RefreshButton onRefresh={fetchUsers} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Users"
          description={`${usersList.length} of ${totalUsers} registered users`}
          icon={Users}
          toolbar={userSearchFilter}
          error={usersError}
          errorTitle="Could not load users"
          onRetry={fetchUsers}
          isEmpty={!loadingUsers && usersList.length === 0}
          emptyTitle="No users found"
          emptyDescription="Try a different search."
          footer={userPagination}
          contentClassName="px-0"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned shelter</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableSkeletonRows columns={4} rows={6} avatar />
                ) : (
                  usersList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              {userInitials(user.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {user.shelterId ? shelterName(user.shelterId) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${user.name} details`}
                            onClick={() => setDetailsUser(user)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Change ${user.name}'s role`}
                            onClick={() => openEditUser(user)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 p-4 md:hidden">
            {loadingUsers ? (
              <RecordCardSkeleton count={3} />
            ) : (
              usersList.map((user) => (
                <RecordCard
                  key={user.id}
                  imageUrl={user.avatarUrl}
                  imageAlt={user.name}
                  title={user.name}
                  subtitle={user.email}
                  badges={
                    <>
                      <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {user.shelterId ? (
                        <Badge variant="muted">{shelterName(user.shelterId)}</Badge>
                      ) : null}
                    </>
                  }
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`View ${user.name} details`}
                        onClick={() => setDetailsUser(user)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`Change ${user.name}'s role`}
                        onClick={() => openEditUser(user)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <SlideOver
        open={userSlideOpen}
        onClose={closeUserSlide}
        size="lg"
        title={editingUser ? `Change role: ${editingUser.name}` : 'Change role'}
        description="Accounts can only have their role changed from the platform portal."
        icon={Pencil}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={closeUserSlide}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" size="lg" className="w-full">
              Save role
            </Button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleUserSubmit} className="grid gap-3">
          {editingUser ? (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{editingUser.name}</p>
              <p className="break-all text-muted-foreground">{editingUser.email}</p>
            </div>
          ) : null}
          <div>
            <Label>Role</Label>
            <Select
              value={userForm.role}
              onChange={(e) => setUserField('role', e.target.value)}
              options={[
                { value: 'adopter', label: 'Adopter' },
                { value: 'shelter_staff', label: 'Shelter staff' },
                { value: 'platform_admin', label: 'Platform admin' },
              ]}
            />
          </div>
          {userForm.role === 'shelter_staff' && (
            <div>
              <Label>Assigned shelter</Label>
              <Select
                value={userForm.shelterId}
                onChange={(e) => setUserField('shelterId', e.target.value)}
                options={[
                  { value: '', label: 'No shelter assigned' },
                  ...shelters.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
          )}
        </form>
      </SlideOver>

      <DetailsModal
        open={detailsUser !== null}
        onClose={() => setDetailsUser(null)}
        title={detailsUser?.name ?? 'User details'}
        description={detailsUser?.email}
        icon={Users}
        footer={
          detailsUser ? (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setDetailsUser(null)}>
                Close
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => detailsUser && openEditUser(detailsUser)}
              >
                <Pencil className="size-4" /> Change role
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailsUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {detailsUser.avatarUrl ? (
                <img
                  src={detailsUser.avatarUrl}
                  alt={detailsUser.name}
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-base font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  {userInitials(detailsUser.name)}
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={roleBadgeVariant(detailsUser.role)} className="capitalize">
                  {detailsUser.role.replace('_', ' ')}
                </Badge>
                <Badge variant="muted">
                  {detailsUser.shelterId
                    ? shelterName(detailsUser.shelterId)
                    : 'No shelter assigned'}
                </Badge>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{detailsUser.email}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="font-medium capitalize">
                  {detailsUser.role.replace('_', ' ')}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Assigned shelter</dt>
                <dd className="font-medium">
                  {detailsUser.shelterId ? shelterName(detailsUser.shelterId) : '—'}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">User ID</dt>
                <dd className="break-all font-medium">{detailsUser.id}</dd>
              </div>
            </dl>
          </div>
        )}
      </DetailsModal>

    </div>
  );
};

