import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from 'src/auth/role.enum';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/user.dto';
import { KeycloakTokenPayload } from 'src/auth/keycloak.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findOrCreateByKeycloak(keycloakPayload: KeycloakTokenPayload) {
    const { sub, email, given_name, family_name } = keycloakPayload;

    // 1. Look up by keycloakSub first (already linked)
    const existingByKcSub = await this.prisma.user.findUnique({
      where: { keycloakSub: sub },
    });
    if (existingByKcSub) {
      // For linked accounts, upgrade role if Keycloak grants admin but never downgrade
      const kcRole = this.determineRoleFromKeycloak(keycloakPayload);
      if (
        kcRole === UserRole.ADMIN &&
        existingByKcSub.role !== UserRole.ADMIN
      ) {
        return this.prisma.user.update({
          where: { id: existingByKcSub.id },
          data: { role: UserRole.ADMIN },
        });
      }
      return existingByKcSub;
    }

    // 2. Try to link by email
    if (email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        // Link existing account — keep existing role (don't downgrade)
        const updateData: Record<string, unknown> = {
          keycloakSub: sub,
          authProvider: 'both',
        };
        // Upgrade to admin if Keycloak grants it and DB doesn't have it yet
        const kcRole = this.determineRoleFromKeycloak(keycloakPayload);
        if (
          kcRole === UserRole.ADMIN &&
          existingByEmail.role !== UserRole.ADMIN
        ) {
          updateData.role = UserRole.ADMIN;
        }
        const updated = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: updateData,
        });
        this.logger.log(
          `Linked Keycloak sub ${sub} to existing user ${updated.id} (${email})`,
        );
        return updated;
      }
    }

    // 3. Create new user
    const role = this.determineRoleFromKeycloak(keycloakPayload);
    const newUser = await this.prisma.user.create({
      data: {
        username: email || sub,
        password: '', // No password for Keycloak-only users
        email: email || null,
        firstName: given_name || null,
        lastName: family_name || null,
        role,
        keycloakSub: sub,
        authProvider: 'keycloak',
      },
    });
    this.logger.log(
      `Created new Keycloak user ${newUser.id} (${email || sub})`,
    );
    return newUser;
  }

  private determineRoleFromKeycloak(
    keycloakPayload: KeycloakTokenPayload,
  ): UserRole {
    // Check scope claim (space-separated)
    if (keycloakPayload.scope) {
      const scopes = keycloakPayload.scope.split(' ');
      if (scopes.includes('revsticks:delete')) return UserRole.ADMIN;
    }

    // Check realm_access.roles
    if (keycloakPayload.realm_access?.roles) {
      if (keycloakPayload.realm_access.roles.includes('revsticks:delete'))
        return UserRole.ADMIN;
    }

    // Check resource_access.*.roles
    if (keycloakPayload.resource_access) {
      for (const resource of Object.values(keycloakPayload.resource_access)) {
        if (resource.roles?.includes('revsticks:delete')) return UserRole.ADMIN;
      }
    }

    return UserRole.USER;
  }

  async findOne(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
  async create(createUserDto: CreateUserDto) {
    // Check if user exists
    const existingUser = await this.findOne(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if email is verified (only if email is provided)
    if (createUserDto.email) {
      const emailValidation = await this.prisma.email_validation.findUnique({
        where: { email: createUserDto.email },
      });

      if (!emailValidation) {
        throw new BadRequestException(
          'Email is not verified. Please verify your email before creating an account.',
        );
      }
    }

    // Extract basic user fields from DTO
    const { password, ...userData } = createUserDto;

    // Create new user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (prisma) => {
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          role: UserRole.USER,
        },
      });

      // Delete the email validation record only if email was provided
      if (createUserDto.email) {
        await prisma.email_validation.delete({
          where: { email: createUserDto.email },
        });
      }

      return newUser;
    });
  }

  async update(
    id: string,
    updateData: Partial<CreateUserDto> & { role?: UserRole },
  ) {
    // Check if user exists
    await this.findById(id);

    // Check username uniqueness if provided
    if (updateData.username) {
      const existingUser = await this.findOne(updateData.username);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    // Handle password hashing if provided
    const data = { ...updateData };
    if (updateData.password) {
      data.password = await bcrypt.hash(updateData.password, 10);
    }

    // Validate role if provided
    if (updateData.role && !Object.values(UserRole).includes(updateData.role)) {
      throw new BadRequestException(
        `Invalid role: ${updateData.role}. Valid roles are: ${Object.values(UserRole).join(', ')}`,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.findById(id);

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update with hashed new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async remove(id: string) {
    // Check if user exists
    await this.findById(id);

    // Prevent admins from deleting themselves (safety feature)
    const userToDelete = await this.findById(id);
    if (userToDelete.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin users cannot be deleted');
    }

    // Update orders to set userId to null
    await this.prisma.sticker_order.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    // Delete the user
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
