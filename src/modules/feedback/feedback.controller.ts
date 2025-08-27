import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Express, Response } from 'express';
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { createBaseResponseDto, UserRoleEnum } from 'src/utils/zod.schemas';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  FeedbackFilteredResponseSchema,
  type FeedbackGroupedArrayResponseDto,
  FeedbackGroupedArrayResponseSchema,
  FeedbackManualRequestDto,
  FeedbackQuerySchemaDto,
  type FeedbackResponseDto,
  FeedbackResponseSchema,
  FeedbackSummaryResponseDto,
  FeedbackSummaryResponseSchema,
  type ReportDownloadQueryDto,
  SentimentEnum,
  SingleFeedbackResponseSchema,
} from './dto/feedback.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
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
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('manual')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: FeedbackManualRequestDto })
  @ApiCreatedResponse({
    type: createBaseResponseDto(
      FeedbackResponseSchema,
      'FeedbackResponseSchema',
    ),
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'feedbacks',
            message: 'At least one feedback is required',
            code: 'EMPTY_ARRAY',
          },
          {
            field: 'feedbacks[0]',
            message: 'Feedback must be at least 10 characters long',
            code: 'TOO_SHORT',
          },
        ],
        path: '/feedback/manual',
        timestamp: new Date().toISOString(),
      },
    },
  })
  @ZodSerializerDto(FeedbackResponseSchema)
  @ApiOperation({
    summary: 'Sending text based feedback and getting the ai analyze',
  })
  @ZodSerializerDto(FeedbackResponseSchema)
  async feedbackManual(
    @Body() body: FeedbackManualRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.feedbackManual(body, req.user);
  }

  @Post('upload')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ZodSerializerDto(FeedbackResponseSchema)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload CSV feedback file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing feedback data',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: createBaseResponseDto(
      FeedbackResponseSchema,
      'FeedbackResponseSchema',
    ),
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'file',
            message: 'File is required',
            code: 'FILE_MISSING',
          },
          {
            field: 'file',
            message: 'The uploaded file must include a "feedback" column',
            code: 'MISSING_FEEDBACK_COLUMN',
          },
          {
            field: 'file',
            message: 'The uploaded file must contain at least one row',
            code: 'EMPTY_FILE',
          },
          {
            field: 'file',
            message: 'Feedback column contains empty values',
            code: 'EMPTY_FEEDBACK_VALUES',
          },
        ],
        path: '/feedback/upload',
        timestamp: new Date().toISOString(),
      },
    },
  })
  @ZodSerializerDto(FeedbackResponseSchema)
  async feedbackUpload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackResponseDto> {
    if (!file) {
      throw new UnprocessableEntityException('No file uploaded');
    }

    const ALLOWED_MIME_TYPES = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/vnd.ms-excel',
    ];

    if (
      !ALLOWED_MIME_TYPES.includes(file.mimetype) ||
      !file.originalname?.toLowerCase().endsWith('.csv')
    ) {
      throw new UnprocessableEntityException(
        `Invalid file type: ${file.mimetype}. Only CSV files are allowed.`,
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new UnprocessableEntityException('File too large (max 10MB)');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    return this.feedbackService.feedbackUpload(file, req.user);
  }

  @ApiBearerAuth()
  @Get('sentiment-summary')
  @ApiOperation({ summary: 'Get sentiment summary for user' })
  @ApiOkResponse({
    type: createBaseResponseDto(
      FeedbackSummaryResponseSchema,
      'FeedbackSummaryResponseSchema',
    ),
  })
  @ZodSerializerDto(FeedbackSummaryResponseDto)
  async getSentimentSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackSummaryResponseDto> {
    return this.feedbackService.feedbackSummary(req.user.id);
  }

  @Get('grouped')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get feedbacks grouped by sentiment',
  })
  @ApiOkResponse({
    type: createBaseResponseDto(
      FeedbackGroupedArrayResponseSchema,
      'FeedbackGroupedArrayResponseSchema',
    ),
  })
  @ZodSerializerDto(FeedbackGroupedArrayResponseSchema)
  async feedbackGrouped(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackGroupedArrayResponseDto> {
    return this.feedbackService.feedbackGrouped(req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiQuery({
    name: 'sentiment',
    required: false,
    enum: SentimentEnum.options,
    description: 'You can choose many',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: createBaseResponseDto(
      FeedbackResponseSchema,
      'FeedbackResponseSchema',
    ),
  })
  @ApiOperation({
    summary: 'Filter feedback by sentiment',
  })
  @ZodSerializerDto(FeedbackFilteredResponseSchema)
  async feedbackFiltered(
    @Query(new ZodValidationPipe(FeedbackQuerySchemaDto))
    query: FeedbackQuerySchemaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.feedbackFiltered(query, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download either pdf or csv report file' })
  @ApiOkResponse({
    description: 'Download report file',
  })
  @Get('report')
  @ApiQuery({ name: 'format', enum: ['csv', 'pdf'], required: true })
  @ApiQuery({ name: 'type', enum: ['detailed', 'summary'], required: true })
  async getFeedbackReport(
    @Query() query: ReportDownloadQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.feedbackService.feedbackReportDownload(query, req.user, res);
  }

  @Get(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetching single feedback by its id' })
  @ApiOkResponse({
    description: 'Fetching single feedback by id',
  })
  @ApiOkResponse({
    type: createBaseResponseDto(
      SingleFeedbackResponseSchema,
      'SingleFeedbackResponseSchema',
    ),
  })
  @ZodSerializerDto(SingleFeedbackResponseSchema)
  async getOneFeedback(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedbackService.getFeedbackById(id);
  }
}
