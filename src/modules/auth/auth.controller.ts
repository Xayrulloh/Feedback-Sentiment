import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import type { RegisterDto } from './dto/register.dto';
import { RegisterSchema } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { LoginSchema } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';


@Controller('auth')
export class AuthController {
    constructor (
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    async register(
    @Body(new ZodValidationPipe(RegisterSchema)) body: RegisterDto
  ) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginDto 
  ) {
    return this.authService.login(body.email, body.password);
  }
}