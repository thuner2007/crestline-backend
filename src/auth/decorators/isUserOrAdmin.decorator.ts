import { applyDecorators, UseGuards } from '@nestjs/common';
import { IsUserOrAdminGuard } from '../guards/isUserOrAdmin.guard';

export function IsUserOrAdmin() {
  return applyDecorators(UseGuards(IsUserOrAdminGuard));
}
