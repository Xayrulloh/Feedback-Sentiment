import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { createBaseResponseDto, UserRoleEnum } from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UserQueryDto,
  UserResponseSchema,
  type UserResponseSchemaType,
  UserSearchQueryDto,
  UserSearchResponseSchema,
  type UserSearchResponseSchemaType,
} from './dto/user.dto';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@ApiForbiddenResponse({
  description: 'Forbidden - user is disabled or suspended',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'User account is disabled' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'user' },
            message: { type: 'string', example: 'User is suspended' },
            code: { type: 'string', example: 'USER_SUSPENDED' },
          },
        },
        example: [
          {
            field: 'user',
            message: 'User is suspended',
            code: 'USER_SUSPENDED',
          },
        ],
      },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Forbidden resource' },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
@ApiInternalServerErrorResponse({
  schema: {
    example: {
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    },
  },
})
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // FIXME: no need api bearer auth since we already gave it in controller layer
  @ApiBearerAuth()
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({
    type: createBaseResponseDto(UserResponseSchema, 'UserResponseSchema'),
  })
  @ZodSerializerDto(UserResponseSchema)
  async getAllUsers(
    @Query(new ZodValidationPipe(UserQueryDto))
    query: UserQueryDto,
  ): Promise<UserResponseSchemaType> {
    return this.userService.getAllUsers(query);
  }

  // FIXME: no need api bearer auth since we already gave it in controller layer
  @ApiBearerAuth()
  @Get('search')
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiOperation({ summary: 'Search users by email (max 5)' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      UserSearchResponseSchema,
      'UserSearchResponseSchema',
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
        },
        path: { type: 'string', example: '/api/users/search' },
        timestamp: { type: 'string', example: new Date().toISOString() },
      },
    },
  })
  @ZodSerializerDto(UserSearchResponseSchema)
  async searchUsers(
    @Query(new ZodValidationPipe(UserSearchQueryDto))
    query: UserSearchQueryDto,
  ): Promise<UserSearchResponseSchemaType> {
    return this.userService.searchUsers(query);
  }
}
