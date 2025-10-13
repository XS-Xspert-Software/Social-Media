-- Migration: Extend posts table for shorts/video metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags TEXT;
