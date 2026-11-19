export const POST_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'proposal', label: 'Proposal' },
];

export const PUBLISH_STATUSES = {
  draft: {
    label: 'Draft',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
  pending_approval: {
    label: 'Pending Approval',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  published: {
    label: 'Published',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  archived: {
    label: 'Archived',
    badgeClass: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  },
};

export const PROPOSAL_STAGES = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];