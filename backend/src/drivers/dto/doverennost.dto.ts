import { IsOptional, IsString } from 'class-validator';

export class DoverennostDto {
  @IsOptional()
  @IsString()
  passport?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
