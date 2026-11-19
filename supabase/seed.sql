-- ============================================================================
-- seed.sql
-- Phase 7: Sample Officials & Published Posts for Testing
-- ============================================================================

INSERT INTO public.officials (id, full_name, position, committee, photo_url, term_start, term_end, display_order, is_active)
VALUES
  (
    '11111111-1111-1111-1111-111111111101',
    'Hon. Roberto Cruz',
    'Punong Barangay',
    'Executive & General Administration',
    NULL,
    '2023-11-01',
    '2026-11-30',
    1,
    TRUE
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Hon. Elena Reyes',
    'Barangay Kagawad',
    'Committee on Health & Sanitation',
    NULL,
    '2023-11-01',
    '2026-11-30',
    2,
    TRUE
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Hon. Marco Villanueva',
    'Barangay Kagawad',
    'Committee on Infrastructure & Waste Management',
    NULL,
    '2023-11-01',
    '2026-11-30',
    3,
    TRUE
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Hon. Clarissa Mendoza',
    'Former Barangay Kagawad',
    'Committee on Youth & Sports',
    NULL,
    '2020-06-01',
    '2023-10-31',
    99,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.posts (
  id,
  type,
  title,
  slug,
  content,
  cover_image_url,
  event_or_target_date,
  publish_status,
  budget,
  target_purok,
  proposal_status,
  published_at
)
VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    'announcement',
    'Monthly Barangay Assembly & Health Advisory',
    'monthly-barangay-assembly-health-advisory-a1b2c',
    'All residents are invited to attend the Monthly Barangay Assembly at the Barangay Hall covered court this Saturday at 8:00 AM. Health workers will also conduct blood pressure checks and immunization updates.',
    NULL,
    '2026-11-21',
    'published',
    NULL,
    NULL,
    NULL,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'achievement',
    'Community Clean-Up & Drainage Desilting Drive Completed',
    'community-cleanup-drainage-desilting-drive-d3e4f',
    'In partnership with purok leaders and resident volunteers, the barangay completed clearing and desilting primary canals and street gutters ahead of the rainy season.',
    NULL,
    '2026-11-10',
    'published',
    NULL,
    NULL,
    NULL,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'proposal',
    'Solar Streetlight Expansion in Purok 4',
    'solar-streetlight-expansion-purok-4-g5h6i',
    'Proposal to install 12 solar-powered LED streetlights along dark residential pathways and access alleys in Purok 4 to improve nighttime safety.',
    NULL,
    '2026-12-15',
    'published',
    185000.00,
    'Purok 4',
    'under_review',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.post_officials (post_id, official_id)
VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103')
ON CONFLICT (post_id, official_id) DO NOTHING;