import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    category: z.enum(["page"]),
    originalUrl: z.string(),
    slug: z.string().optional(),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        canonical: z.string().url().optional(),
      })
      .optional(),
  }),
});

export const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishDate: z.string(),
  category: z.enum(["article"]),
  originalUrl: z.string(),
  slug: z.string().optional(),
  image: z.string(),
  imageDescription: z.string().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().url().optional(),
    })
    .optional(),
});

// Export the inferred type
export type Article = z.infer<typeof articleSchema>;

const articles = defineCollection({
  schema: articleSchema,
});

const team = defineCollection({
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    team: z.string().optional(),
  }),
});

const homepageCollection = defineCollection({
  loader: glob({
    pattern: "**/-*.{md,mdx,json}",
    base: "src/content/homepage",
  }),
  schema: z.object({
    banner: z.object({
      title: z.string(),
      content: z.string().optional(),
      image: z.string(),
      button: z
        .object({
          label: z.string(),
          link: z.string(),
          enable: z.boolean().default(true),
        })
        .optional(),
    }),
    key_features: z.object({
      title: z.string(),
      description: z.string(),
      feature_list: z
        .array(
          z.object({
            icon: z.string(),
            title: z.string(),
            content: z.string(),
          })
        )
        .optional(),
    }),

    service: z.object({
      homepage_tab: z.object({
        title: z.string(),
        description: z.string(),
        tab_list: z
          .array(
            z.object({
              title: z.string(),
              icon: z.string(),
              image: z.string(),
            })
          )
          .optional(),
      }),

      our_service: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          image: z.string().optional(),
          list: z.array(z.string()).optional(),
          video: z
            .object({
              thumbnail: z.string(),
              video_id: z.string(),
            })
            .optional(),
          button: z
            .object({
              label: z.string(),
              link: z.string(),
              enable: z.boolean().default(true),
            })
            .optional(),
        })
      ),
    }),
    testimonial: z.object({
      title: z.string(),
      description: z.string(),
      testimonial_list: z
        .array(
          z.object({
            author: z.string(),
            avatar: z.string(),
            organization: z.string(),
            rating: z.enum(["one", "two", "three", "four", "five"]),
            content: z.string(),
          })
        )
        .optional(),
    }),
  }),
});

// Features collections schema
const featuresCollection = defineCollection({
  loader: glob({ pattern: "**/-*.{md,mdx}", base: "src/content/features" }),
  schema: z.object({
    title: z.string(),
    meta_title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    banner: z.object({
      title: z.string(),
      content: z.string(),
      image: z.string(),
      button: z
        .object({
          label: z.string(),
          link: z.string(),
          enable: z.boolean().default(true),
        })
        .optional(),
    }),

    // Project Management Section
    project_management: z.object({
      title: z.string(),
      content: z.string(),
      management: z.object({
        title: z.string(),
        projects: z
          .array(
            z.object({
              title: z.string(),
              content: z.string(),
              icon: z.string(),
            })
          )
          .optional(),
      }),

      // Feature Service Section
      feature_service: z.object({
        title: z.string(),
        description: z.string(),
        image: z.string(),
        list: z.array(z.string()).optional(),
        buttons: z.array(
          z.object({
            label: z.string(),
            link: z.string(),
            enable: z.boolean().default(true),
            outline: z.boolean().optional(),
          })
        ),
      }),

      // Feature Tab Section
      feature_tab: z.object({
        title: z.string(),
        list: z
          .array(
            z.object({
              title: z.string(),
              content: z.string(),
              image: z.string(),
            })
          )
          .optional(),
      }),
    }),
  }),
});

export const collections = {
  pages,
  articles,
  team,
  features: featuresCollection,
  homepage: homepageCollection,
};
