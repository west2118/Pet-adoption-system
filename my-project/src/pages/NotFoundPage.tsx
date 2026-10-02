import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';

export const NotFoundPage = () => {
  return (
    <Container className="py-20 text-center">
      <p className="text-6xl font-extrabold">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="mt-4 inline-block">
        <Button>Go home</Button>
      </Link>
    </Container>
  );
};
