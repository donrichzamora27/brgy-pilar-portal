import { FolderKanban } from 'lucide-react';
import PublicFeedView from '../../components/posts/PublicFeedView';

export default function ProposalsPage() {
  return (
    <PublicFeedView
      type="proposal"
      badgeLabel="Development & Infrastructure"
      title="Barangay Project Proposals"
      description="Track proposed, approved, ongoing, and completed barangay projects, budgets, and target puroks."
      Icon={FolderKanban}
    />
  );
}
