import { Link } from 'react-router-dom';
import { EmptyState } from '../components/shared/EmptyState';

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="That page doesn't exist."
      action={<Link to="/" className="btn btn-primary">Back to Dashboard</Link>}
    />
  );
}
