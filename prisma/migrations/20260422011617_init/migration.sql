-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('AI', 'SKIN');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'READY', 'APPROVED', 'REJECTED', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('B_ROLL', 'IMAGE', 'AUDIO_NARRATION_KO', 'AUDIO_BGM', 'SUBTITLE_SRT_EN', 'SUBTITLE_DATA');

-- CreateEnum
CREATE TYPE "PipelineStep" AS ENUM ('NEWS_FETCH', 'NEWS_CURATE', 'SCRIPT_GENERATE_KO', 'SCRIPT_TRANSLATE_EN', 'BROLL_FETCH', 'TTS_GENERATE_KO', 'SUBTITLE_GENERATE_EN', 'VIDEO_RENDER', 'NOTION_CREATE', 'SLACK_NOTIFY', 'APPROVAL', 'YOUTUBE_UPLOAD', 'YOUTUBE_CAPTION_UPLOAD');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('STARTED', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titleHash" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "sourceLang" TEXT NOT NULL DEFAULT 'ko',

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "titleKo" TEXT NOT NULL,
    "scriptKo" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "scriptEn" TEXT NOT NULL,
    "tags" TEXT[],
    "subtitleSegments" JSONB,
    "newsItemId" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "audioUrl" TEXT,
    "subtitleUrl" TEXT,
    "ttsProvider" TEXT NOT NULL DEFAULT 'supertone',
    "ttsVoiceId" TEXT,
    "ttsCredits" INTEGER,
    "ttsDurationSec" DOUBLE PRECISION,
    "youtubeVideoId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "notionPageId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "lastAnalyzedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAsset" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "videoId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineLog" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "step" "PipelineStep" NOT NULL,
    "status" "StepStatus" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,

    CONSTRAINT "PipelineLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCost" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "endpoint" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "charCount" INTEGER,
    "credits" INTEGER,
    "cost" DECIMAL(10,4) NOT NULL,
    "videoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_url_key" ON "NewsItem"("url");

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_titleHash_key" ON "NewsItem"("titleHash");

-- CreateIndex
CREATE INDEX "NewsItem_channel_publishedAt_idx" ON "NewsItem"("channel", "publishedAt");

-- CreateIndex
CREATE INDEX "NewsItem_fetchedAt_idx" ON "NewsItem"("fetchedAt");

-- CreateIndex
CREATE INDEX "Video_channel_status_idx" ON "Video"("channel", "status");

-- CreateIndex
CREATE INDEX "Video_status_createdAt_idx" ON "Video"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE INDEX "VideoAsset_videoId_type_idx" ON "VideoAsset"("videoId", "type");

-- CreateIndex
CREATE INDEX "PipelineRun_channel_startedAt_idx" ON "PipelineRun"("channel", "startedAt");

-- CreateIndex
CREATE INDEX "PipelineLog_runId_step_idx" ON "PipelineLog"("runId", "step");

-- CreateIndex
CREATE INDEX "ApiCost_service_createdAt_idx" ON "ApiCost"("service", "createdAt");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_newsItemId_fkey" FOREIGN KEY ("newsItemId") REFERENCES "NewsItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLog" ADD CONSTRAINT "PipelineLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PipelineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
