import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/test.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Public()
  @Post()
  create(@Body() createTestDto: CreateTestDto) {
    return this.testService.create(createTestDto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.testService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.testService.findOne(id);
  }

  @Public()
  @Put(':id')
  update(@Param('id') id: number, @Body() updateTestDto: CreateTestDto) {
    return this.testService.update(id, updateTestDto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.testService.remove(id);
  }
}
