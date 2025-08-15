import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
// biome-ignore lint/style/useImportType: Needed for DI
import { AuthService } from './auth.service';
import {
  AuthCredentialsDto,
  AuthResponseDto,
  AuthResponseSchema,
  type AuthResponseSchemaType,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ZodSerializerDto(AuthResponseSchema)
  async register(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.login(body);
  }
}
