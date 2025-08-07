import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor (
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    async register(
    @Body() body: AuthCredentialsDto
  ) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(
    @Body() body: AuthCredentialsDto
  ) {
    return this.authService.login(body.email, body.password);
  }
}