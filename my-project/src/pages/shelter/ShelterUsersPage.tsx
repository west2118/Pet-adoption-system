import { Eye, Pencil, Plus, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import {
  DebouncedSearchInput,
  DetailsModal,
  PasswordInput,
  RefreshButton,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  SlideOver,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/Form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useAuth } from '@/hooks/useAuth';
import { useShelters } from '@/hooks/useData';
import { ApiError } from '@/lib/apiClient';
import {
  createShelterUser,
  listShelterUsersPaginated,
  removeShelterUser,
  updateShelterUser,
} from '@/services/api';
import type { ShelterAccountType } from '@/services/api';
import type { User } from '@/types';
import { describeApiError } from '@/utils/errors';

const accountTypeOf = (user: User): ShelterAccountType =>
  user.isOwner ? 'admin' : 'staff';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

const userInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const AccountTypeBadge = ({ user }: { user: User }) => {
  const isAdmin = accountTypeOf(user) === 'admin';
  return (
    <Badge variant={isAdmin ? 'info' : 'muted'}>
      {isAdmin ? (
        <>
          <ShieldCheck className="mr-1 size-3.5" /> Admin
        </>
      ) : (
        'Staff'
      )}
    </Badge>
  );
};

export const ShelterUsersPage = () => {
  const { user } = useAuth();
  const { shelters } = useShelters();
  const myShelterId = user?.shelterId ?? null;
  const shelterName =
    shelters.find((shelter) => shelter.id === myShelterId)?.name ?? 'your shelter';
  const canManage = Boolean(user?.isOwner);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [slideOpen, setSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    accountType: 'staff' as ShelterAccountType,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listShelterUsersPaginated({
        page,
        limit: pageSize,
        search: query.trim(),
      });
      setUsersList(res.items);
      setTotalUsers(res.total);
      setLoadError(null);
    } catch (err) {
      setLoadError(describeApiError(err, 'Failed to load staff accounts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () =>
    setForm({ name: '', email: '', password: '', accountType: 'staff' });

  const openAddUser = () => {
    setEditingUser(null);
    resetForm();
    setSlideOpen(true);
  };

  const openEditUser = (account: User) => {
    setEditingUser(account);
    setDetailsUser(null);
    setForm({
      name: account.name,
      email: account.email,
      password: '',
      accountType: accountTypeOf(account),
    });
    setSlideOpen(true);
  };

  const closeSlide = () => {
    setSlideOpen(false);
    setEditingUser(null);
  };

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const name = form.name.trim();
    const email = form.email.trim();
    if (form.password && form.password.length < 8) {
      toast.warning('Password must be at least 8 characters.');
      return;
    }

    try {
      if (editingUser) {
        const updated = await updateShelterUser(editingUser.id, {
          name,
          email,
          accountType: form.accountType,
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success(`${updated.name} updated successfully!`);
      } else {
        const created = await createShelterUser({
          name,
          email,
          password: form.password,
          accountType: form.accountType,
        });
        toast.success(
          `${created.name} added. They can now sign in and access ${shelterName} only.`,
        );
        resetForm();
      }
      closeSlide();
      await fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to save user. Please try again.',
      );
    }
  };

  const removeUser = async () => {
    if (!pendingDeleteUser) return;
    setIsDeleting(true);
    try {
      await removeShelterUser(pendingDeleteUser.id);
      toast.success(`${pendingDeleteUser.name} removed.`);
      setPendingDeleteUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to remove user. Please try again.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const addUserButton = canManage ? (
    <Button size="sm" onClick={openAddUser}>
      <Plus className="size-4" /> Add user
    </Button>
  ) : undefined;

  const toolbar = (
    <DebouncedSearchInput
      value={query}
      onDebouncedChange={(value) => {
        setQuery(value);
        setPage(1);
      }}
      placeholder="Search by name or email"
      className="w-full sm:w-[260px]"
      wrapperClassName="sm:w-[260px]"
    />
  );

  const pagination =
    totalUsers > 0 ? (
      <TablePagination
        currentPage={page}
        totalItems={totalUsers}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        label="users"
      />
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Users"
        subtitle={`Manage the admins and staff who can access ${shelterName}.`}
        actions={<RefreshButton onRefresh={fetchUsers} />}
      />

      <div className="mt-6 space-y-4">
        {!canManage ? (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Only shelter admins can add or change accounts. Contact your shelter admin if
            you need access changes.
          </div>
        ) : null}

        <TableCard
          title="Shelter team"
          description={`${usersList.length} of ${totalUsers} accounts`}
          icon={Users}
          action={addUserButton}
          toolbar={toolbar}
          error={loadError}
          errorTitle="Could not load staff accounts"
          onRetry={fetchUsers}
          isEmpty={!loading && usersList.length === 0}
          emptyTitle="No staff accounts yet"
          emptyDescription={
            canManage
              ? 'Add your first staff or admin account for this shelter.'
              : 'Your shelter admin has not added any staff accounts yet.'
          }
          footer={pagination}
          contentClassName="px-0"
        >
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows columns={4} rows={5} avatar />
                ) : (
                  usersList.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={account.name}
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              {userInitials(account.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">
                              {account.name}
                              {account.id === user?.id ? (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                  (you)
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {account.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AccountTypeBadge user={account} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.accountStatus === 'pending' ? 'warning' : 'success'
                          }
                        >
                          {account.accountStatus === 'pending' ? 'Pending' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${account.name} details`}
                            onClick={() => setDetailsUser(account)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canManage ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`Edit ${account.name}`}
                              onClick={() => openEditUser(account)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {canManage && account.id !== user?.id ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`Remove ${account.name}`}
                              onClick={() => setPendingDeleteUser(account)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {loading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              usersList.map((account) => (
                <RecordCard
                  key={account.id}
                  imageUrl={account.avatarUrl}
                  imageAlt={account.name}
                  title={account.name}
                  subtitle={account.email}
                  badges={
                    <>
                      <AccountTypeBadge user={account} />
                      <Badge variant="muted">{shelterName} only</Badge>
                    </>
                  }
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`View ${account.name} details`}
                        onClick={() => setDetailsUser(account)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Edit ${account.name}`}
                          onClick={() => openEditUser(account)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canManage && account.id !== user?.id ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Remove ${account.name}`}
                          onClick={() => setPendingDeleteUser(account)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </>
                  }
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        size="lg"
        title={editingUser ? `Edit ${editingUser.name}` : 'Add shelter user'}
        description={
          editingUser
            ? 'Update this account. Leaving the password blank keeps the current one.'
            : `This account will only be able to access ${shelterName}.`
        }
        icon={editingUser ? Pencil : Plus}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={closeSlide}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="shelter-user-form"
              size="lg"
              className="w-full"
              disabled={!canManage}
            >
              {editingUser ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        }
      >
        <form id="shelter-user-form" onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <Label htmlFor="shelter-user-name">Full name</Label>
            <Input
              id="shelter-user-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="shelter-user-email">Email</Label>
            <Input
              id="shelter-user-email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="shelter-user-type">Account type</Label>
            <Select
              id="shelter-user-type"
              value={form.accountType}
              onChange={(e) => setField('accountType', e.target.value)}
              options={ACCOUNT_TYPE_OPTIONS}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Admins can manage this page; staff can use the rest of the shelter portal.
            </p>
          </div>
          <div>
            <Label htmlFor="shelter-user-password">
              {editingUser ? 'New password (optional)' : 'Password'}
            </Label>
            <PasswordInput
              id="shelter-user-password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              required={!editingUser}
              minLength={8}
              autoComplete="new-password"
              placeholder={editingUser ? 'Leave blank to keep current password' : 'At least 8 characters'}
            />
          </div>
        </form>
      </SlideOver>

      <DetailsModal
        open={detailsUser !== null}
        onClose={() => setDetailsUser(null)}
        title={detailsUser?.name ?? 'User details'}
        description={detailsUser?.email}
        icon={UserCog}
        footer={
          detailsUser ? (
            <div
              className={
                canManage ? 'grid grid-cols-2 gap-3' : 'flex justify-end'
              }
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setDetailsUser(null)}
              >
                Close
              </Button>
              {canManage ? (
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => detailsUser && openEditUser(detailsUser)}
                >
                  <Pencil className="size-4" /> Edit
                </Button>
              ) : undefined}
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
                <AccountTypeBadge user={detailsUser} />
                <Badge variant="muted">{shelterName} only</Badge>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{detailsUser.email}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Account type</dt>
                <dd className="font-medium capitalize">{accountTypeOf(detailsUser)}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Shelter access</dt>
                <dd className="font-medium">{shelterName}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">
                  {detailsUser.accountStatus ?? 'approved'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </DetailsModal>

      <ConfirmDeleteModal
        open={pendingDeleteUser !== null}
        onClose={() => (isDeleting ? undefined : setPendingDeleteUser(null))}
        onConfirm={() => void removeUser()}
        title="Remove user?"
        description="This account will lose access to the shelter portal immediately."
        itemName={pendingDeleteUser?.name}
        confirmLabel="Remove user"
        isDeleting={isDeleting}
      />
    </div>
  );
};
