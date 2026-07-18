import { IsOptional, IsString } from 'class-validator';

export class DoverennostDto {
  @IsOptional()
  @IsString()
  passport?: string;

  /** Pasport berilgan sana (ISO yoki dd.MM.yyyy) — blanka uchun */
  @IsOptional()
  @IsString()
  passportIssued?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  patronymic?: string;

  /** Shablondagi «Ферганский» / «Ферганская» o‘rniga */
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
