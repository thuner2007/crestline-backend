import { Controller, Get, Post, Param } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';

@Roles(UserRole.ADMIN)
@Controller('tracker')
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}
  @Get()
  findAll() {
    return this.trackerService.findAll();
  }

  @Get(':path')
  findOne(@Param('path') path: string) {
    return this.trackerService.findOne(path);
  }

  @Post('resetAll')
  resetAll() {
    return this.trackerService.resetAll();
  }

  @Post('reset/:path')
  resetOne(@Param('path') path: string) {
    return this.trackerService.resetOne(path);
  }

  @Post(':path')
  addVisit(@Param('path') path: string) {
    return this.trackerService.addVisit(path);
  }
}
