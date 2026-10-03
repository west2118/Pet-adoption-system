import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export { LoginPage } from './LoginPage';

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
          <CardDescription>Join Paws&Homes to adopt and save favorites.</CardDescription>
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
