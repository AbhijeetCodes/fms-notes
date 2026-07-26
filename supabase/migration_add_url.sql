-- Migration: Add URL support for link-only entries
-- Run this in the Supabase SQL Editor

ALTER TABLE public.documents ADD COLUMN url text;
ALTER TABLE public.documents ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.documents ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE public.documents ALTER COLUMN file_size DROP NOT NULL;
ALTER TABLE public.documents ALTER COLUMN file_type DROP NOT NULL;
