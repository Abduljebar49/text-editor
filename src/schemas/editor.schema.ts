// src/schemas/editorSchemas.ts
import { z } from 'zod';

export const EditorContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  format: z.enum(['html', 'markdown']).default('html'),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    wordCount: z.number().min(0),
    characterCount: z.number().min(0),
  }).optional(),
});

export const ExportOptionsSchema = z.object({
  includeStyles: z.boolean().default(true),
  includeMeta: z.boolean().default(true),
  format: z.enum(['html', 'txt']).default('html'),
});

export type EditorContent = z.infer<typeof EditorContentSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;