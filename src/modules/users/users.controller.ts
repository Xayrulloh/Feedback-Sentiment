import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserSchema } from 'src/utils/zod.schemas';
import { UsersResponseSchemaDto } from './dto/users.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('disable/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle disable/enable a user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({ type: UsersResponseSchemaDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({
    description: 'Validation failed (uuid is expected)',
  })
  @ZodSerializerDto(UserSchema)
  async disable(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.userDisableToggle(id);
  }

  @Post('suspend/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend (soft-delete) a user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID (uuid)' })
  @ApiOkResponse({ type: UsersResponseSchemaDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({
    description: 'Validation failed (uuid is expected)',
  })
  @ZodSerializerDto(UserSchema)
  async suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.userSuspend(id);
  }
}
