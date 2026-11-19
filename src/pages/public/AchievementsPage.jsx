import { Award } from 'lucide-react';
import PublicFeedView from '../../components/posts/PublicFeedView';

export default function AchievementsPage() {
  return (
    <PublicFeedView
      type="achievement"
      badgeLabel="Completed Milestones"
      title="Barangay Achievements"
      description="Completed community programs, public service milestones, and recognized initiatives."
      Icon={Award}
    />
  );
}
