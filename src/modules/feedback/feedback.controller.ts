import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Express, Response } from 'express';
import { ZodSerializerDto } from 'nestjs-zod';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import {
  FeedbackSummaryResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackGroupedArrayResponseSchema,
  FeedbackManualRequestDto,
  FeedbackResponseDto,
  FeedbackResponseSchema,
  FeedbackFilteredResponseSchema,
  type FeedbackQuerySchemaDto,
  type ReportDownloadQueryDto,
  SentimentEnum,
  FeedbackQuerySchema,
} from './dto/feedback.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('manual')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: FeedbackManualRequestDto })
  @ApiCreatedResponse({ type: FeedbackResponseDto })
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
  @UseGuards(AuthGuard('jwt'))
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
    type: FeedbackResponseDto,
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
  @UseGuards(AuthGuard('jwt'))
  @Get('sentiment-summary')
  @ApiOperation({ summary: 'Get sentiment summary for user' })
  @ApiOkResponse({
    type: FeedbackSummaryResponseDto,
  })
  @ZodSerializerDto(FeedbackSummaryResponseDto)
  async getSentimentSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackSummaryResponseDto> {
    return this.feedbackService.feedbackSummary(req.user.id);
  }

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard('jwt'))
  // @Sse('sentiment-summary/stream')
  // @ApiConsumes('text/event-stream')
  // @ApiOperation({
  //   summary: 'Stream sentiment summary updates',
  //   description:
  //     'Real-time sentiment analysis summary updates for the authenticated user',
  // })
  // @ApiOkResponse({ type: FeedbackSummaryEventDto })
  // feedbackStreamSummary(
  //   @Req() req: AuthenticatedRequest,
  // ): Observable<FeedbackSummaryEventDto> {
  //   return interval(5000).pipe(
  //     startWith(0),
  //     switchMap(() => this.feedbackService.feedbackSummary(req.user.id)),
  //     map((summary) => ({
  //       type: 'sentiment_update' as const,
  //       data: summary.data,
  //       updatedAt: summary.updatedAt || new Date().toISOString(),
  //     })),
  //     distinctUntilChanged(
  //       (prev, curr) => JSON.stringify(prev.data) === JSON.stringify(curr.data),
  //     ),
  //     share(),
  //   );
  // }

  @Get('grouped')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get feedbacks grouped by sentiment',
  })
  @ApiOkResponse({
    type: FeedbackGroupedArrayResponseDto,
  })
  @ZodSerializerDto(FeedbackGroupedArrayResponseSchema)
  async feedbackGrouped(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackGroupedArrayResponseDto> {
    return this.feedbackService.feedbackGrouped(req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiQuery({ name: 'sentiment', required: false, enum: SentimentEnum.options })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    type: FeedbackResponseDto,
  })
  @ZodSerializerDto(FeedbackFilteredResponseSchema)
  @ApiOperation({
    summary: 'Filter feedback by sentiment',
  })
  @ZodSerializerDto(FeedbackFilteredResponseSchema)
  async feedbackFiltered(
    @Query(FeedbackQuerySchema)
    query: FeedbackQuerySchemaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.feedbackFiltered(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
}
