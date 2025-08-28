import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { UserStatusGuard } from 'src/common/guards/user-status.guards';
import { createBaseResponseDto } from 'src/utils/zod.schemas';
// biome-ignore lint/style/useImportType: Needed for DI
import { AuthService } from './auth.service';
import {
  AuthAdminResponseSchema,
  type AuthAdminResponseSchemaType,
  AuthCredentialsDto,
  AuthUserResponseSchema,
  type AuthUserResponseSchemaType,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(UserStatusGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiCreatedResponse({
    type: createBaseResponseDto(
      AuthUserResponseSchema,
      'AuthUserResponseSchema',
    ),
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
  @ZodSerializerDto(AuthUserResponseSchema)
  async registerUser(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthUserResponseSchemaType> {
    return this.authService.registerUser(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({
    type: createBaseResponseDto(
      AuthUserResponseSchema,
      'AuthUserResponseSchema',
    ),
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
        message: { type: 'string', example: 'Invalid credentials' },
        path: { type: 'string', example: '/auth/login' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(AuthUserResponseSchema)
  async loginUser(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthUserResponseSchemaType> {
    return this.authService.loginUser(body);
  }

  @Post('register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiCreatedResponse({
    type: createBaseResponseDto(
      AuthAdminResponseSchema,
      'AuthAdminResponseSchema',
    ),
  })
  @ApiConflictResponse({
    description: 'Email already in use',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email already in use' },
        path: { type: 'string', example: '/auth/register/admin' },
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
        path: { type: 'string', example: '/auth/register/admin' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(AuthAdminResponseSchema)
  async registerAdmin(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthAdminResponseSchemaType> {
    return this.authService.registerAdmin(body);
  }

  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOkResponse({
    type: createBaseResponseDto(
      AuthAdminResponseSchema,
      'AuthAdminResponseSchema',
    ),
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
        path: { type: 'string', example: '/auth/login/admin' },
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
        message: { type: 'string', example: 'Invalid credentials' },
        path: { type: 'string', example: '/auth/login/admin' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(AuthAdminResponseSchema)
  async loginAdmin(
    @Body() body: AuthCredentialsDto,
  ): Promise<AuthAdminResponseSchemaType> {
    return this.authService.loginAdmin(body);
  }
}
