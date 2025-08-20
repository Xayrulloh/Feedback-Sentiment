import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRoleEnum, UserSchema } from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersResponseSchemaDto } from './dto/users.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRoleEnum.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiForbiddenResponse({
  description: 'Forbidden resource',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 403 },
      message: { type: 'string', example: 'Forbidden resource' },
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
      errors: [
        {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      ],
      timestamp: new Date().toISOString(),
    },
  },
})
@ApiNotFoundResponse({
  description: 'User not found',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 404 },
      message: { type: 'string', example: 'User not found' },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
@ApiBadRequestResponse({
  description: 'Validation failed (uuid is expected)',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'number', example: 400 },
      message: {
        type: 'string',
        example: 'Validation failed (uuid is expected)',
      },
      timestamp: { type: 'string', example: new Date().toISOString() },
    },
  },
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('disable/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle disable/enable a user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({ type: UsersResponseSchemaDto })
  @ZodSerializerDto(UserSchema)
  async disable(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.userDisableToggle(id);
  }

  @Post('suspend/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend (soft-delete) a user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({ type: UsersResponseSchemaDto })
  @ZodSerializerDto(UserSchema)
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.userSuspend(id);
  }
}
