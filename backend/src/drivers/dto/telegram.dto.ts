import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class TelegramMessageDto {
  @IsOptional()
  @IsIn(['debt', 'custom'])
  template?: 'debt' | 'custom';

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}
