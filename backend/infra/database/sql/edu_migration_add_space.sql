-- Migration: Add space management integration to education platform
-- Date: 2026-02-03
-- Description: Add space_id, owner_id, visibility to edu_scripts and space_id to edu_student_projects

-- Step 1: Add space integration fields to edu_scripts table
ALTER TABLE edu_scripts
  ADD COLUMN space_id BIGINT UNSIGNED NOT NULL COMMENT '空间ID' AFTER id,
  ADD COLUMN owner_id BIGINT UNSIGNED NOT NULL COMMENT '创建者用户ID' AFTER space_id,
  ADD COLUMN visibility ENUM('private', 'team', 'public') NOT NULL DEFAULT 'team' COMMENT '可见性：private=私有，team=团队，public=公开' AFTER description,
  ADD INDEX idx_space_id (space_id),
  ADD INDEX idx_owner_id (owner_id),
  ADD INDEX idx_space_visibility (space_id, visibility);

-- Step 2: Add space field to edu_student_projects table
ALTER TABLE edu_student_projects
  ADD COLUMN space_id BIGINT UNSIGNED NOT NULL COMMENT '空间ID' AFTER id,
  ADD INDEX idx_space_id (space_id),
  ADD INDEX idx_student_space (student_id, space_id);

-- Step 3: Update test data with real space_id and owner_id
-- Note: Replace 7602171965524148224 with actual space_id and USER_ID with actual user_id
-- You can find your user_id by querying: SELECT id FROM user WHERE email='your_email';

-- Update the test script with space context
-- UPDATE edu_scripts
-- SET space_id = 7602171965524148224,
--     owner_id = [YOUR_USER_ID],
--     visibility = 'team'
-- WHERE id = 1;

-- Verification queries
-- SELECT id, name, space_id, owner_id, visibility, difficulty FROM edu_scripts;
-- SELECT id, title, space_id, user_id, script_id, status FROM edu_student_projects;
