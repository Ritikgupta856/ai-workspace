-- Alter the embedding column to use 768 dimensions
ALTER TABLE "KnowledgeChunk" ALTER COLUMN "embedding" TYPE vector(768);
