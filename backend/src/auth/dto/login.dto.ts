import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsIn(['admin', 'driver'])
  role!: 'admin' | 'driver';

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password!: string;
}
