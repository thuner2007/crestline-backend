import { Public } from 'src/auth/decorators/public.decorator';
import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  Param,
  Put,
  Get,
  Patch,
  Req,
  NotFoundException,
  Delete,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request } from 'express';
import { CreateUserDto } from './dto/user.dto';
import { UserRole } from 'src/auth/role.enum';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  private async checkUserAuthorization(
    requestingUserId: string,
    targetUserId: string,
    requestingUserRole: string,
    queryUserId?: string,
  ) {
    // Allow if user is admin - admins can perform actions on any user
    if (requestingUserRole === UserRole.ADMIN) {
      return true;
    }

    // For non-admin users, check if query parameter user ID matches the requesting user ID
    if (!queryUserId || queryUserId !== requestingUserId) {
      throw new UnauthorizedException(
        'Query user ID must match authenticated user ID',
      );
    }

    // Allow if they're accessing their own resource
    if (requestingUserId === targetUserId) {
      return true;
    }

    throw new UnauthorizedException('Insufficient permissions');
  }

  @SkipThrottle()
  @Get('me')
  async getMe(@Req() req: Request & { user: { sub: string } }) {
    try {
      const user = await this.usersService.findById(req.user.sub);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        statusCode: HttpStatus.OK,
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          street: user.street,
          houseNumber: user.houseNumber,
          zipCode: user.zipCode,
          city: user.city,
          country: user.country,
          additionalAddressInfo: user.additionalAddressInfo,
        },
      };
    } catch (error) {
      this.logger.error(
        `Get current user failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  @SkipThrottle()
  @Patch('me')
  async updateMe(
    @Body() updateData: Partial<CreateUserDto> & { role?: UserRole },
    @Req() req: Request & { user: { sub: string; role: string } },
  ) {
    try {
      // Users cannot update their own role via this endpoint
      if (updateData.role) {
        delete updateData.role;
      }

      const updatedUser = await this.usersService.update(
        req.user.sub,
        updateData,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          street: updatedUser.street,
          houseNumber: updatedUser.houseNumber,
          zipCode: updatedUser.zipCode,
          city: updatedUser.city,
          country: updatedUser.country,
          additionalAddressInfo: updatedUser.additionalAddressInfo,
        },
      };
    } catch (error) {
      this.logger.error(
        `User update failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  @Public()
  @SkipThrottle()
  @Get('csrf-token')
  getCsrfToken(@Req() req) {
    return { token: req.csrfToken() };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 requests per 10 minutes
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const newUser = await this.usersService.create(createUserDto);

      this.logger.log(`User created successfully: ${createUserDto.username}`);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        username: newUser.username,
      };
    } catch (error) {
      this.logger.error(
        `User creation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        street: user.street,
        houseNumber: user.houseNumber,
        zipCode: user.zipCode,
        city: user.city,
        country: user.country,
        additionalAddressInfo: user.additionalAddressInfo,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      statusCode: HttpStatus.OK,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        street: user.street,
        houseNumber: user.houseNumber,
        zipCode: user.zipCode,
        city: user.city,
        country: user.country,
        additionalAddressInfo: user.additionalAddressInfo,
      },
    };
  }
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('userId') queryUserId: string,
    @Req() req: Request & { user: { sub: string; role: string } },
  ) {
    try {
      const bearerToken = req.headers.authorization;
      this.logger.log(
        `User deletion attempt for ID: ${id}, Bearer token: ${bearerToken}`,
      );

      // Check authorization
      await this.checkUserAuthorization(
        req.user.sub,
        id,
        req.user.role,
        queryUserId,
      );

      await this.usersService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'User deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `User deletion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('userId') queryUserId: string,
    @Body() updateData: Partial<CreateUserDto> & { role?: UserRole },
    @Req() req: Request & { user: { sub: string; role: string } },
  ) {
    try {
      // Check authorization
      await this.checkUserAuthorization(
        req.user.sub,
        id,
        req.user.role,
        queryUserId,
      );

      // Only admins can update roles
      if (updateData.role && req.user.role !== UserRole.ADMIN) {
        delete updateData.role;
      }

      const updatedUser = await this.usersService.update(id, updateData);

      return {
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `User update failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  @Put(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Query('userId') queryUserId: string,
    @Body() updatePasswordDto: { oldPassword: string; newPassword: string },
    @Req() req: Request & { user: { sub: string; role: string } },
  ) {
    try {
      // Check authorization
      await this.checkUserAuthorization(
        req.user.sub,
        id,
        req.user.role,
        queryUserId,
      );

      const updatedUser = await this.usersService.updatePassword(
        id,
        updatePasswordDto.oldPassword,
        updatePasswordDto.newPassword,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Password updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `Password update failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
