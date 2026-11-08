import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

import {
  DebouncedSearchInput,
  RecordCardSkeleton,
  RefreshButton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  focusFirstError,
} from '@/components/shared';
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  AccountTypeBadge,
  ShelterUserDetailsModal,
  ShelterUserFormSlideOver,
  ShelterUserMobileCard,
  UserAvatar,
} from '@/components/users';
import {
  EMPTY_SHELTER_USER_FORM,
  accountTypeOf,
  type ShelterUserFormValues,
} from '@/data/shelterUsers';
import { useAuth } from '@/hooks/useAuth';
import { useShelters } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import {
  SHELTER_USERS_QUERY_KEY,
  useShelterUserMutations,
} from '@/hooks/useShelterUserMutations';
import { shelterUserCreateSchema, shelterUserUpdateSchema, toFieldErrors } from '@/lib/validators';
import { listShelterUsersPaginated } from '@/services/api';
import type { User } from '@/types';
import { describeApiError } from '@/utils/errors';

export const ShelterUsersPage = () => {
  const { user } = useAuth();
  const { shelters } = useShelters();

  const myShelterId = user?.shelterId ?? null;
  const shelterName =
    shelters.find((shelter) => shelter.id === myShelterId)?.name ?? 'your shelter';
  const canManage = Boolean(user?.isOwner);

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState('');

  // Dialog state
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState<ShelterUserFormValues>(EMPTY_SHELTER_USER_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ShelterUserFormValues, string>>
  >({});

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...SHELTER_USERS_QUERY_KEY, { page, pageSize, search: query.trim() }],
    queryFn: () =>
      listShelterUsersPaginated({
        page,
        limit: pageSize,
        search: query.trim(),
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const usersList = data?.items ?? [];
  const totalUsers = data?.total ?? 0;

  const closeSlide = () => {
    setSlideOpen(false);
    setEditingUser(null);
    setFormErrors({});
  };

  const { createMutation, updateMutation, deleteMutation, isSaving, isDeleting } =
    useShelterUserMutations({
      onCreated: closeSlide,
      onUpdated: closeSlide,
      onDeleted: () => setPendingDeleteUser(null),
    });

  const openAddUser = () => {
    setEditingUser(null);
    setForm(EMPTY_SHELTER_USER_FORM);
    setFormErrors({});
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
    setFormErrors({});
    setSlideOpen(true);
  };

  const setField = (key: keyof ShelterUserFormValues, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFormErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSaveUser = () => {
    if (!canManage || isSaving) return;

    const parsed = (editingUser ? shelterUserUpdateSchema : shelterUserCreateSchema).safeParse(
      form,
    );
    if (!parsed.success) {
      setFormErrors(toFieldErrors<keyof ShelterUserFormValues>(parsed.error.issues));
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setFormErrors({});

    const values = parsed.data;
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        updates: {
          name: values.name,
          email: values.email,
          accountType: values.accountType,
          ...(values.password ? { password: values.password } : {}),
        },
      });
      return;
    }

    createMutation.mutate({
      input: {
        name: values.name,
        email: values.email,
        password: values.password,
        accountType: values.accountType,
      },
      shelterName,
    });
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Users"
        subtitle={`Manage the admins and staff who can access ${shelterName}.`}
        actions={<RefreshButton onRefresh={refresh} />}
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
          description="Admins and staff assigned to this shelter."
          icon={Users}
          action={
            canManage ? (
              <Button size="sm" onClick={openAddUser}>
                <Plus className="size-4" /> Add user
              </Button>
            ) : undefined
          }
          toolbar={
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
          }
          error={
            error
              ? describeApiError(error, 'Failed to load staff accounts. Please try again.')
              : null
          }
          errorTitle="Could not load staff accounts"
          onRetry={() => void refetch()}
          isEmpty={!showLoading && !error && usersList.length === 0}
          emptyTitle="No staff accounts yet"
          emptyDescription={
            canManage
              ? 'Add your first staff or admin account for this shelter.'
              : 'Your shelter admin has not added any staff accounts yet.'
          }
          footer={
            totalUsers > 10 ? (
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
            ) : undefined
          }
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
                {showLoading ? (
                  <TableSkeletonRows columns={4} rows={5} avatar />
                ) : (
                  usersList.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={account.name} avatarUrl={account.avatarUrl} />
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
                      <TableCell className="text-center">                          <div className="flex justify-center gap-1">
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
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              usersList.map((account) => (
                <ShelterUserMobileCard
                  key={account.id}
                  account={account}
                  shelterName={shelterName}
                  canManage={canManage}
                  isSelf={account.id === user?.id}
                  onView={() => setDetailsUser(account)}
                  onEdit={() => openEditUser(account)}
                  onRemove={() => setPendingDeleteUser(account)}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <ShelterUserFormSlideOver
        open={slideOpen}
        user={editingUser}
        form={form}
        shelterName={shelterName}
        canManage={canManage}
        isSaving={isSaving}
        errors={formErrors}
        onChange={setField}
        onClose={closeSlide}
        onSubmit={handleSaveUser}
      />

      <ShelterUserDetailsModal
        user={detailsUser}
        shelterName={shelterName}
        canManage={canManage}
        onClose={() => setDetailsUser(null)}
        onEdit={openEditUser}
      />

      <ConfirmDeleteModal
        open={pendingDeleteUser !== null}
        onClose={() => (isDeleting ? undefined : setPendingDeleteUser(null))}
        onConfirm={() => {
          if (pendingDeleteUser) {
            deleteMutation.mutate({ id: pendingDeleteUser.id, name: pendingDeleteUser.name });
          }
        }}
        title="Remove user?"
        description="This account will lose access to the shelter portal immediately."
        itemName={pendingDeleteUser?.name}
        confirmLabel="Remove user"
        isDeleting={isDeleting}
      />
    </div>
  );
};
