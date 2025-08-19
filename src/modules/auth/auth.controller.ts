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
  AuthAdminResponseDto,
  AuthAdminResponseSchema,
  type AuthAdminResponseSchemaType,
  AuthCredentialsDto,
  AuthUserResponseDto,
  AuthUserResponseSchema,
  type AuthUserResponseSchemaType,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiCreatedResponse({ type: AuthUserResponseDto })
  @ZodSerializerDto(AuthUserResponseSchema)
  async registerUser(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthUserResponseSchemaType> {
    return this.authService.registerUser(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({ type: AuthUserResponseDto })
  @ZodSerializerDto(AuthUserResponseSchema)
  async loginUser(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthUserResponseSchemaType> {
    return this.authService.loginUser(body);
  }

  @Post('register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiCreatedResponse({ type: AuthAdminResponseDto })
  @ZodSerializerDto(AuthAdminResponseSchema)
  async registerAdmin(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthAdminResponseSchemaType> {
    return this.authService.registerAdmin(body);
  }

  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({ type: AuthAdminResponseDto })
  @ZodSerializerDto(AuthAdminResponseSchema)
  async loginAdmin(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthAdminResponseSchemaType> {
    return this.authService.loginAdmin(body);
  }
}
