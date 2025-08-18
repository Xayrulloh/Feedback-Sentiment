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
  @ZodSerializerDto(AuthResponseSchema)
  async login(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.login(body);
  }

    @Post('register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ZodSerializerDto(AuthResponseSchema)
  async registerAdmin(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.registerAdmin(body);
  }

  
  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({ type: AuthResponseDto })
   @ZodSerializerDto(AuthResponseSchema)
  async loginAdmin(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.loginAdmin(body);
  }
}
