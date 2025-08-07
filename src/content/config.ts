import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    category: z.enum(['page']),
    originalUrl: z.string(),
    slug: z.string().optional(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().url().optional(),
    }).optional(),
  }),
});

export const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishDate: z.string(),
  category: z.enum(['article']),
  originalUrl: z.string(),
  slug: z.string().optional(),
  image: z.string(),
  imageDescription: z.string().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    canonical: z.string().url().optional(),
  }).optional(),
});

// Export the inferred type
export type Article = z.infer<typeof articleSchema>;

const articles = defineCollection({
  schema: articleSchema,
});

export const collections = {
  pages,
  articles,
};