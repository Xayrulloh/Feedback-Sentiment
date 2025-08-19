import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { createSuccessApiResponseDto } from 'src/utils/zod.schemas';
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
    description: 'Email already in use',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email already in use' },
        path: { type: 'string', example: '/auth/register' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Invalid email format' },
              code: { type: 'string', example: 'INVALID_EMAIL' },
            },
          },
          example: [
            {
              field: 'email',
              message: 'Invalid email format',
              code: 'INVALID_EMAIL',
            },
            {
              field: 'password',
              message: 'Password must be at least 8 characters long',
              code: 'WEAK_PASSWORD',
            },
          ],
        },
        path: { type: 'string', example: '/auth/register' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
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
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Invalid email format' },
              code: { type: 'string', example: 'INVALID_EMAIL' },
            },
          },
          example: [
            {
              field: 'email',
              message: 'Invalid email format',
              code: 'INVALID_EMAIL',
            },
            {
              field: 'password',
              message: 'Password must be at least 8 characters long',
              code: 'WEAK_PASSWORD',
            },
          ],
        },
        path: { type: 'string', example: '/auth/login' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid email or password' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', example: 'email' },
              message: {
                type: 'string',
                example: 'Incorrect email or password',
              },
              code: { type: 'string', example: 'INVALID_CREDENTIALS' },
            },
          },
          example: [
            {
              field: 'email',
              message: 'Incorrect email or password',
              code: 'INVALID_CREDENTIALS',
            },
          ],
        },
        path: { type: 'string', example: '/auth/login' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(AuthResponseSchema)
  async login(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    return this.authService.login(body);
  }
}
