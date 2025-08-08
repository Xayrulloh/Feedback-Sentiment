import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthCredentialsDto, AuthResponseDto, AuthResponseSchema } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ZodSerializerDto(AuthResponseSchema)
  async register(@Body() body: AuthCredentialsDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() body: AuthCredentialsDto) {
    return this.authService.login(body);
  }
}
