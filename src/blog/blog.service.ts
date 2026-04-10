import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBlogDto: CreateBlogDto) {
    const { images, links, translations, ...blogData } = createBlogDto;

    // Log the translations to debug
    console.log(
      'Creating blog post with translations:',
      JSON.stringify(translations, null, 2),
    );

    return this.prisma.blog_post.create({
      data: {
        ...blogData,
        writingDate: new Date(blogData.writingDate),
        translations: {
          create: translations.map((trans) => ({
            language: trans.language,
            title: trans.title,
            markdownContent: trans.markdownContent,
          })),
        },
        images: images
          ? {
              create: images.map((img) => ({
                url: img.url,
                altText: img.altText,
              })),
            }
          : undefined,
        links: links
          ? {
              create: links.map((link) => ({
                translations: {
                  create: link.translations.map((trans) => ({
                    language: trans.language,
                    url: trans.url,
                    title: trans.title,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        translations: true,
        images: true,
        links: { include: { translations: true } },
      },
    });
  }

  async findAll(activeOnly: boolean = false, language?: string) {
    const where: any = activeOnly ? { active: true } : {};

    // If language is specified, only return blogs that have that language translation
    if (language) {
      where.translations = { some: { language: language } };
    }

    const blogs = await this.prisma.blog_post.findMany({
      where,
      include: {
        translations: language
          ? { where: { language } } // Only include the requested language
          : true, // Include all translations
        images: true,
        links: {
          include: {
            translations: language
              ? { where: { language } } // Only include the requested language
              : true, // Include all translations
          },
        },
      },
      orderBy: { writingDate: 'desc' },
    });

    return blogs;
  }

  async findOne(id: string, language?: string) {
    const blog = await this.prisma.blog_post.findUnique({
      where: { id },
      include: {
        translations: language
          ? { where: { language } } // Only include the requested language
          : true, // Include all translations
        images: true,
        links: {
          include: {
            translations: language
              ? { where: { language } } // Only include the requested language
              : true, // Include all translations
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog post with ID ${id} not found`);
    }

    return blog;
  }

  // Helper method to convert title to URL-friendly slug
  private nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace special characters and spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  async findOneByTitle(title: string, language?: string) {
    // Convert the input title to a slug for comparison
    const searchSlug = this.nameToSlug(title);

    // Get all blog posts and find the one with matching slug in any translation
    const blogs = await this.prisma.blog_post.findMany({
      include: {
        translations: language
          ? { where: { language } } // Only include the requested language
          : true, // Include all translations
        images: true,
        links: {
          include: {
            translations: language
              ? { where: { language } } // Only include the requested language
              : true, // Include all translations
          },
        },
      },
    });

    // Find blog where any translation's slugified title matches
    const blog = blogs.find((b) =>
      b.translations.some((t) => this.nameToSlug(t.title) === searchSlug),
    );

    if (!blog) {
      throw new NotFoundException(`Blog post with title "${title}" not found`);
    }

    return blog;
  }

  async update(id: string, updateBlogDto: UpdateBlogDto) {
    // First check if blog exists
    await this.findOne(id);

    const { images, links, translations, ...blogData } = updateBlogDto;

    // If writingDate is provided, convert it to Date
    const data: any = { ...blogData };
    if (blogData.writingDate) {
      data.writingDate = new Date(blogData.writingDate);
    }

    // Handle translations update
    if (translations !== undefined) {
      // Delete existing translations
      await this.prisma.blog_post_translation.deleteMany({
        where: { blogPostId: id },
      });

      // Create new translations
      if (translations.length > 0) {
        data.translations = {
          create: translations.map((trans) => ({
            language: trans.language,
            title: trans.title,
            markdownContent: trans.markdownContent,
          })),
        };
      }
    }

    // Handle images update
    if (images !== undefined) {
      // Delete existing images
      await this.prisma.blog_image.deleteMany({ where: { blogPostId: id } });

      // Create new images
      if (images.length > 0) {
        data.images = {
          create: images.map((img) => ({ url: img.url, altText: img.altText })),
        };
      }
    }

    // Handle links update
    if (links !== undefined) {
      // Delete existing links (cascade will delete translations)
      await this.prisma.blog_link.deleteMany({ where: { blogPostId: id } });

      // Create new links with translations
      if (links.length > 0) {
        data.links = {
          create: links.map((link) => ({
            translations: {
              create: link.translations.map((trans) => ({
                language: trans.language,
                url: trans.url,
                title: trans.title,
              })),
            },
          })),
        };
      }
    }

    return this.prisma.blog_post.update({
      where: { id },
      data,
      include: {
        translations: true,
        images: true,
        links: { include: { translations: true } },
      },
    });
  }

  async remove(id: string) {
    // First check if blog exists
    await this.findOne(id);

    return this.prisma.blog_post.delete({ where: { id } });
  }

  async activate(id: string) {
    // First check if blog exists
    await this.findOne(id);

    return this.prisma.blog_post.update({
      where: { id },
      data: { active: true },
      include: {
        translations: true,
        images: true,
        links: { include: { translations: true } },
      },
    });
  }

  async deactivate(id: string) {
    // First check if blog exists
    await this.findOne(id);

    return this.prisma.blog_post.update({
      where: { id },
      data: { active: false },
      include: {
        translations: true,
        images: true,
        links: { include: { translations: true } },
      },
    });
  }

  async incrementReadCount(id: string) {
    // First check if blog exists
    await this.findOne(id);

    return this.prisma.blog_post.update({
      where: { id },
      data: { readCount: { increment: 1 } },
      include: {
        translations: true,
        images: true,
        links: { include: { translations: true } },
      },
    });
  }
}
