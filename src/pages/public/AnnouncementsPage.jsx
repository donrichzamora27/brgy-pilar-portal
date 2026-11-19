import { Megaphone } from 'lucide-react';
import PublicFeedView from '../../components/posts/PublicFeedView';

export default function AnnouncementsPage() {
  return (
    <PublicFeedView
      type="announcement"
      badgeLabel="Public Advisories"
      title="Barangay Announcements"
      description="Official notices, schedules, community advisories, and public assemblies."
      Icon={Megaphone}
    />
  );
}
