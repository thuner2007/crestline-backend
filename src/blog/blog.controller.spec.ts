import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { PrismaService } from 'prisma/prisma.service';
import { MinioService } from 'src/storage/minio.service';

describe('BlogController', () => {
  let controller: BlogController;
  let service: BlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        BlogService,
        {
          provide: PrismaService,
          useValue: {
            blog_post: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: MinioService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BlogController>(BlogController);
    service = module.get<BlogService>(BlogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of blog posts', async () => {
      const result = [];
      jest.spyOn(service, 'findAll').mockResolvedValue(result as any);

      expect(await controller.findAll()).toBe(result);
    });

    it('should filter by active status when activeOnly is true', async () => {
      const result = [];
      jest.spyOn(service, 'findAll').mockResolvedValue(result as any);

      await controller.findAll('true');
      expect(service.findAll).toHaveBeenCalledWith(true, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a single blog post', async () => {
      const result = { id: '1', title: 'Test Blog' };
      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      expect(await controller.findOne('1')).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new blog post', async () => {
      const createBlogDto = {
        title: 'Test Blog',
        author: 'Test Author',
        writingDate: '2025-11-06T10:00:00Z',
        htmlContent: '<p>Test content</p>',
      };
      const result = { id: '1', ...createBlogDto };
      jest.spyOn(service, 'create').mockResolvedValue(result as any);

      expect(await controller.create(createBlogDto as any)).toBe(result);
    });
  });

  describe('activate', () => {
    it('should activate a blog post', async () => {
      const result = { id: '1', active: true };
      jest.spyOn(service, 'activate').mockResolvedValue(result as any);

      expect(await controller.activate('1')).toBe(result);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a blog post', async () => {
      const result = { id: '1', active: false };
      jest.spyOn(service, 'deactivate').mockResolvedValue(result as any);

      expect(await controller.deactivate('1')).toBe(result);
    });
  });
});
