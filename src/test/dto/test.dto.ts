import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTestDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString()
  description: string;
}
