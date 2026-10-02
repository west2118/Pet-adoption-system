import { PawPrint } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('juan@example.com');
  const [role, setRole] = useState<UserRole>('adopter');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
    navigate(role === 'adopter' ? '/pets' : role === 'shelter_staff' ? '/shelter' : '/admin');
  };

  return (
    <Container className="max-w-md py-12">
      <Card>
        <CardHeader className="text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white">
            <PawPrint className="size-6" />
          </span>
          <CardTitle className="mt-2">Welcome back</CardTitle>
          <CardDescription>
            Sign in with email/password or OAuth (Supabase Auth in production).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-pass">Password</Label>
              <Input id="login-pass" type="password" placeholder="••••••••" required />
            </div>
            <div>
              <Label htmlFor="login-role">Demo role (RBAC preview)</Label>
              <Select
                id="login-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                options={[
                  { value: 'adopter', label: 'Adopter / Public User' },
                  { value: 'shelter_staff', label: 'Shelter Staff' },
                  { value: 'platform_admin', label: 'Platform Admin' },
                ]}
              />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{' '}
              <Link to="/signup" className="font-medium text-foreground underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'new@example.com', 'adopter');
    navigate('/pets');
  };

  return (
    <Container className="max-w-md py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Join PawsConnect to adopt and save favorites.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="su-name">Full name</Label>
              <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="su-pass">Password</Label>
              <Input id="su-pass" type="password" placeholder="Min. 8 characters" required />
            </div>
            <Button type="submit" className="w-full">Sign up</Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-foreground underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};
