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
import { ZodSerializerDto, ZodValidationPipe } from 'nestjs-zod';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import {
  FeedbackGetSummaryResponseDto,
  FeedbackGroupedArrayResponseDto,
  FeedbackGroupedArrayResponseSchema,
  type FeedbackManualRequestDto,
  FeedbackResponseDto,
  FeedbackResponseSchema,
  FilteredFeedbackResponseSchema,
  GetFeedbackQuerySchemaDto,
  type ReportDownloadQueryDto,
  SentimentEnum,
} from './dto/feedback.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: FeedbackResponseDto,
  })
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


  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload CSV feedback file',
    description: 'Upload a CSV file containing feedback data for processing',
  })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get sentiment summary for user',
    description: 'Retrieve sentiment analysis summary for a specific user',
  })
  @ApiOkResponse({
    type: FeedbackGetSummaryResponseDto,
  })
  @ZodSerializerDto(FeedbackGetSummaryResponseDto)
  async getSentimentSummary(
    @Req() req: AuthenticatedRequest,
  ): Promise<FeedbackGetSummaryResponseDto> {
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('grouped')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get grouped feedback',
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiQuery({ name: 'sentiment', required: false, enum: SentimentEnum.options })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Filter feedback by sentiment',
    description: 'Filtering feedback by sentimant with pagination',
  })
  @ZodSerializerDto(FilteredFeedbackResponseSchema)
  async feedbackFiltered(
    @Query(new ZodValidationPipe(GetFeedbackQuerySchemaDto))
    query: GetFeedbackQuerySchemaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.feedbackFiltered(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Download either pdf or csv report file',
    description:
      'Download either pdf or csv file report with full details or just summary',
  })
  @HttpCode(HttpStatus.OK)
  @Get('report')
  @ApiQuery({ name: 'format', required: true, type: String })
  @ApiQuery({ name: 'type', required: true, type: String })
  async getFeedbackReport(
    @Query() query: ReportDownloadQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.feedbackService.feedbackReportDownload(query, req.user, res);
  }
}
