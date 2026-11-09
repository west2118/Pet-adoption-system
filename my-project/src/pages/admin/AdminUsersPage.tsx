import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AdminUserDetailsModal,
  AdminUserFormSlideOver,
  AdminUserMobileCard,
  UserRoleBadge,
} from '@/components/admin';
import {
  DebouncedSearchInput,
  RefreshButton,
  RecordCardSkeleton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  focusFirstError,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { UserAvatar } from '@/components/users';
import type { AdminUserFormValues } from '@/data/adminPresets';
import { useShelters } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import {
  ADMIN_USERS_QUERY_KEY,
  useAdminUserMutations,
} from '@/hooks/useAdminUserMutations';
import { adminUserRoleSchema, toFieldErrors } from '@/lib/validators';
import { listUsersPaginated } from '@/services/api';
import type { User } from '@/types';

export const AdminUsersPage = () => {
  const { shelters } = useShelters();

  const [userPageSize, setUserPageSize] = useState(10);
  const [userQuery, setUserQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userSlideOpen, setUserSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<AdminUserFormValues>({
    role: 'adopter',
    shelterId: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AdminUserFormValues, string>>>({});

  const shelterName = (id: string) => shelters.find((s) => s.id === id)?.name ?? 'Unknown';

  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      ...ADMIN_USERS_QUERY_KEY,
      {
        page: userPage,
        limit: userPageSize,
        search: userQuery.trim(),
      },
    ],
    queryFn: () =>
      listUsersPaginated({
        page: userPage,
        limit: userPageSize,
        search: userQuery.trim(),
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const usersList = usersData?.items ?? [];
  const totalUsers = usersData?.total ?? 0;

  const handleUserSaved = () => {
    setUserSlideOpen(false);
    setEditingUser(null);
    setFormErrors({});
  };

  const { updateRoleMutation, isUpdating } = useAdminUserMutations({
    onUpdated: handleUserSaved,
  });

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setDetailsUser(null);
    setUserForm({ role: user.role, shelterId: user.shelterId ?? '' });
    setFormErrors({});
    setUserSlideOpen(true);
  };

  const handleUserSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const parsed = adminUserRoleSchema.safeParse(userForm);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors<keyof AdminUserFormValues>(parsed.error.issues);
      setFormErrors(fieldErrors);
      focusFirstError();
      return;
    }

    setFormErrors({});
    const shelterId =
      userForm.role === 'shelter_staff' && userForm.shelterId
        ? userForm.shelterId
        : undefined;

    updateRoleMutation.mutate({
      userId: editingUser.id,
      role: userForm.role,
      shelterId,
    });
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Platform users"
        subtitle="Manage accounts, staff roles, and administrative privileges."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="All users"
          description="Directory of registered adopters, staff, and platform admins."
          icon={Users}
          toolbar={
            <DebouncedSearchInput
              value={userQuery}
              onDebouncedChange={(val) => {
                setUserQuery(val);
                setUserPage(1);
              }}
              placeholder="Search users by name or email"
              className="w-full sm:w-[260px]"
              wrapperClassName="sm:w-[260px]"
            />
          }
          isEmpty={!showLoading && usersList.length === 0}
          emptyTitle="No users found"
          emptyDescription={
            userQuery ? 'Try adjusting your search query.' : 'No users have registered yet.'
          }
          footer={
            totalUsers > 0 ? (
              <TablePagination
                currentPage={userPage}
                totalItems={totalUsers}
                pageSize={userPageSize}
                onPageChange={(next) => setUserPage(next)}
                onPageSizeChange={(newSize) => {
                  setUserPageSize(newSize);
                  setUserPage(1);
                }}
                label="users"
              />
            ) : undefined
          }
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
                {showLoading ? (
                  <TableSkeletonRows columns={4} rows={6} avatar />
                ) : (
                  usersList.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} size="md" />
                          <div className="min-w-0">
                            <p className="font-medium">{u.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <UserRoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.shelterId ? shelterName(u.shelterId) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${u.name} details`}
                            onClick={() => setDetailsUser(u)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Edit ${u.name} role`}
                            onClick={() => handleOpenEdit(u)}
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
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              usersList.map((u) => (
                <AdminUserMobileCard
                  key={u.id}
                  user={u}
                  shelterName={u.shelterId ? shelterName(u.shelterId) : 'None'}
                  onView={setDetailsUser}
                  onEdit={handleOpenEdit}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <AdminUserFormSlideOver
        open={userSlideOpen}
        editingUser={editingUser}
        form={userForm}
        formErrors={formErrors}
        shelters={shelters}
        isUpdating={isUpdating}
        onClose={() => {
          setUserSlideOpen(false);
          setEditingUser(null);
        }}
        onChangeRole={(role) => {
          setUserForm((prev) => ({
            ...prev,
            role,
            shelterId: role === 'shelter_staff' ? prev.shelterId : '',
          }));
          if (formErrors.role) setFormErrors((prev) => ({ ...prev, role: undefined }));
        }}
        onChangeShelter={(shelterId) => {
          setUserForm((prev) => ({ ...prev, shelterId }));
          if (formErrors.shelterId) setFormErrors((prev) => ({ ...prev, shelterId: undefined }));
        }}
        onSubmit={handleUserSubmit}
      />

      <AdminUserDetailsModal
        user={detailsUser}
        shelterName={detailsUser?.shelterId ? shelterName(detailsUser.shelterId) : 'None'}
        onClose={() => setDetailsUser(null)}
        onEdit={(u) => {
          setDetailsUser(null);
          handleOpenEdit(u);
        }}
      />
    </div>
  );
};
