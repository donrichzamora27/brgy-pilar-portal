-- ============================================================================
-- 001_init_barangay_schema.sql
-- Phase 1: Enums, Tables, Constraints, Triggers, RLS & Storage Bucket
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Custom Enums
-- ----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'resident');
CREATE TYPE public.post_type AS ENUM ('announcement', 'achievement', 'proposal');
CREATE TYPE public.publish_status AS ENUM ('draft', 'pending_approval', 'published', 'archived');
CREATE TYPE public.proposal_stage AS ENUM ('proposed', 'under_review', 'approved', 'ongoing', 'completed');

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------

-- User profiles extending auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) > 0),
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'resident',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Barangay officials (only is_active = true shown publicly)
CREATE TABLE public.officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) > 0),
  position TEXT NOT NULL CHECK (char_length(trim(position)) > 0),
  committee TEXT,
  photo_url TEXT,
  term_start DATE,
  term_end DATE,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unified posts table (announcements, achievements, proposals)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.post_type NOT NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  slug TEXT UNIQUE NOT NULL CHECK (char_length(trim(slug)) > 0),
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  cover_image_url TEXT,
  event_or_target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  publish_status public.publish_status NOT NULL DEFAULT 'draft',

  -- Proposal-specific fields
  budget NUMERIC(12, 2) CHECK (budget IS NULL OR budget >= 0),
  target_purok TEXT,
  proposal_status public.proposal_stage,

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-many join table between posts and officials
-- ON DELETE RESTRICT prevents deleting an official who still owns/links posts
CREATE TABLE public.post_officials (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  official_id UUID NOT NULL REFERENCES public.officials(id) ON DELETE RESTRICT,
  PRIMARY KEY (post_id, official_id)
);

-- Attachments (images & PDFs, max 5 MB = 5,242,880 bytes)
CREATE TABLE public.post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL CHECK (char_length(trim(file_name)) > 0),
  file_url TEXT NOT NULL CHECK (char_length(trim(file_url)) > 0),
  file_type TEXT NOT NULL CHECK (
    file_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  file_size_bytes INT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resident / authenticated user reactions (1 reaction per user per post)
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'support', 'heart')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Resident / authenticated user comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Helpful Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_officials_active_order ON public.officials (is_active, display_order, full_name);
CREATE INDEX idx_posts_type_status_date ON public.posts (type, publish_status, event_or_target_date DESC);
CREATE INDEX idx_posts_publish_status ON public.posts (publish_status, published_at DESC);
CREATE INDEX idx_posts_proposal_filters ON public.posts (proposal_status, target_purok) WHERE type = 'proposal';
CREATE INDEX idx_post_officials_official_id ON public.post_officials (official_id);
CREATE INDEX idx_post_attachments_post_id ON public.post_attachments (post_id);
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions (post_id);
CREATE INDEX idx_post_comments_post_created ON public.post_comments (post_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- 4. Helper Functions & Triggers
-- ----------------------------------------------------------------------------

-- Helper used in RLS policies to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Automatically create a resident profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1), 'Resident'),
    NEW.raw_user_meta_data->>'avatar_url',
    'resident'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Keep updated_at current & set published_at automatically when published
CREATE OR REPLACE FUNCTION public.sync_post_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.publish_status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_sync_timestamps ON public.posts;
CREATE TRIGGER trg_posts_sync_timestamps
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_timestamps();

CREATE OR REPLACE FUNCTION public.sync_comment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_updated_at ON public.post_comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_comment_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Enable Row-Level Security & Define Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'resident');

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.is_admin()
  );

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- OFFICIALS (Public sees only is_active = true; Admin sees all)
CREATE POLICY "officials_select_active_or_admin"
  ON public.officials FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "officials_insert_admin"
  ON public.officials FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "officials_update_admin"
  ON public.officials FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "officials_delete_admin"
  ON public.officials FOR DELETE
  USING (public.is_admin());

-- POSTS (Public sees only published; Admin sees draft, pending_approval, published, archived)
CREATE POLICY "posts_select_published_or_admin"
  ON public.posts FOR SELECT
  USING (publish_status = 'published' OR public.is_admin());

CREATE POLICY "posts_insert_admin"
  ON public.posts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "posts_update_admin"
  ON public.posts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "posts_delete_admin"
  ON public.posts FOR DELETE
  USING (public.is_admin());

-- POST_OFFICIALS
CREATE POLICY "post_officials_select_published_or_admin"
  ON public.post_officials FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.publish_status = 'published'
    )
  );

CREATE POLICY "post_officials_insert_admin"
  ON public.post_officials FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "post_officials_update_admin"
  ON public.post_officials FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "post_officials_delete_admin"
  ON public.post_officials FOR DELETE
  USING (public.is_admin());

-- POST_ATTACHMENTS
CREATE POLICY "post_attachments_select_published_or_admin"
  ON public.post_attachments FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.publish_status = 'published'
    )
  );

CREATE POLICY "post_attachments_insert_admin"
  ON public.post_attachments FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "post_attachments_update_admin"
  ON public.post_attachments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "post_attachments_delete_admin"
  ON public.post_attachments FOR DELETE
  USING (public.is_admin());

-- POST_REACTIONS (Public read; Authenticated user can react on published posts)
CREATE POLICY "post_reactions_select_public"
  ON public.post_reactions FOR SELECT
  USING (TRUE);

CREATE POLICY "post_reactions_insert_authenticated"
  ON public.post_reactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.publish_status = 'published'
    )
  );

CREATE POLICY "post_reactions_update_own"
  ON public.post_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_reactions_delete_own_or_admin"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- POST_COMMENTS (Public read; Authenticated user can comment on published posts)
CREATE POLICY "post_comments_select_public"
  ON public.post_comments FOR SELECT
  USING (TRUE);

CREATE POLICY "post_comments_insert_authenticated"
  ON public.post_comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.publish_status = 'published'
    )
  );

CREATE POLICY "post_comments_update_own"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_comments_delete_own_or_admin"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. Storage Bucket & Storage RLS (barangay-media, 5 MB limit)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barangay-media',
  'barangay-media',
  TRUE,
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "barangay_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barangay-media');

CREATE POLICY "barangay_media_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'barangay-media' AND public.is_admin());

CREATE POLICY "barangay_media_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'barangay-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'barangay-media' AND public.is_admin());

CREATE POLICY "barangay_media_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'barangay-media' AND public.is_admin());