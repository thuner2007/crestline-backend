import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Test } from './dto/entity/test.entity';
import { Repository } from 'typeorm';
import { CreateTestDto } from './dto/test.dto';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  create(createTestDto: CreateTestDto) {
    const newTest = this.testRepository.create({
      ...createTestDto,
      createdAt: new Date(),
    });
    return this.testRepository.save(newTest);
  }

  findAll() {
    return this.testRepository.find();
  }

  findOne(id: number) {
    return this.testRepository.findOne({ where: { id } });
  }

  async update(id: number, updateTestDto: CreateTestDto) {
    await this.testRepository.update(id, updateTestDto);
    return this.testRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const test = await this.testRepository.findOne({ where: { id } });
    if (!test) {
      return { message: 'Test not found' };
    }
    try {
      await this.testRepository.delete(id);
      return { message: 'Test deleted' };
    } catch (error) {
      return { message: `Error deleting test: ${error}` };
    }
  }
}
