-- AlterEnum
BEGIN;
CREATE TYPE "PipelineStep_new" AS ENUM ('NEWS_FETCH', 'NEWS_CURATE', 'SCRIPT_GENERATE_KO', 'BROLL_FETCH', 'TTS_GENERATE_KO', 'SUBTITLE_GENERATE_KO', 'VIDEO_RENDER', 'NOTION_CREATE', 'SLACK_NOTIFY', 'APPROVAL', 'YOUTUBE_UPLOAD', 'YOUTUBE_CAPTION_UPLOAD');
ALTER TABLE "PipelineLog" ALTER COLUMN "step" TYPE "PipelineStep_new" USING ("step"::text::"PipelineStep_new");
ALTER TYPE "PipelineStep" RENAME TO "PipelineStep_old";
ALTER TYPE "PipelineStep_new" RENAME TO "PipelineStep";
DROP TYPE "public"."PipelineStep_old";
COMMIT;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "descriptionEn",
DROP COLUMN "scriptEn",
DROP COLUMN "titleEn",
ADD COLUMN     "descriptionKo" TEXT;

