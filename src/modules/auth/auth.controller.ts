import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { createErrorApiResponseDto, createSuccessApiResponseDto } from 'src/utils/zod.schemas';
// biome-ignore lint/style/useImportType: Needed for DI
import { AuthService } from './auth.service';
import {
  AuthCredentialsDto,
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
  @ApiCreatedResponse({
    type: createSuccessApiResponseDto(AuthResponseSchema, 'AuthResponseSchema'),
  })
  @ApiConflictResponse({
    type: createErrorApiResponseDto(AuthResponseSchema, 'AuthConflictResponseSchema'),
  })
  @ZodSerializerDto(AuthResponseSchema)
  async register(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({
    type: createSuccessApiResponseDto(AuthResponseSchema, 'AuthResponseSchema'),
  })
  @ZodSerializerDto(AuthResponseSchema)
  async login(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.login(body);
  }
}
