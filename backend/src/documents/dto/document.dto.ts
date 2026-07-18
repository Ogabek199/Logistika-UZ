import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** JSON often sends "" for cleared optional dates; treat as absent. */
function emptyToUndefined({ value }: { value: unknown }) {
  if (value === '' || value === null) return undefined;
  return value;
}

export class CreateDocDto {
  @IsString()
  driverId!: string;

  @IsOptional()
  @IsString()
  trailerNo?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  tirNumber?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  dazvolNumber?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paid?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  months?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateDocDto {
  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  trailerNo?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  tirNumber?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  dazvolNumber?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paid?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  months?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  note?: string;

  /** Payment ledger comment only — does not overwrite document.note */
  @IsOptional()
  @IsString()
  paymentNote?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  driverId?: string;

  @IsString()
  type!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  date?: string;
}
