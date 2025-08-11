import { 
    Controller, 
    Post, 
    Body, 
    UseGuards, 
    Req, 
    HttpCode, 
    HttpStatus,
    HttpException,
    InternalServerErrorException,
    UnprocessableEntityException,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeedbackRequestDto, FeedbackResponseDto, FeedbackArrayResponseDto, FeedbackArrayResponseSchema } from './dto/feedback.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTPayloadType } from '../auth/dto/auth.dto';
import type { UserSchemaType } from 'src/utils/zod.schemas';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
    constructor(
        private readonly feedbackService: FeedbackService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('manual')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: FeedbackArrayResponseDto,
        description: 'Array of processed feedback items'
    })
    @ZodSerializerDto(FeedbackArrayResponseSchema)
    async processManualFeedback(
        @Body() body: FeedbackRequestDto, 
        @Req() req: Request & {user: UserSchemaType}
    ) {
        const user = req.user;
        
        try {
            const result = await this.feedbackService.processFeedback(body, user);

            return result;
        } catch (error) {
            console.error('Error processing manual feedback:', error);

            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new InternalServerErrorException(
                'Failed to process feedback',
                error.message
            );
        }
    }

  @Post('upload')
  async uploadFeedback(@UploadedFile() file: Multer.File, @Req() req: Request & {user: UserSchemaType}) {

    if (!file) {
      throw new UnprocessableEntityException('No file uploaded');
    }

    const allowedMimeTypes = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new UnprocessableEntityException(
        `Invalid file type: ${file.mimetype}. Only CSV files are allowed.`,
      );
    }

    if (!file.originalname?.toLowerCase().endsWith('.csv')) {
      throw new UnprocessableEntityException('File must have .csv extension');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new UnprocessableEntityException('File too large (max 10MB)');
    }

    try {
      const feedbacks = await this.feedbackService.processFeedbackFile(file);
      const user = req.user;

      const result = await this.feedbackService.processFeedback(feedbacks, user);
      return result;

    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new UnprocessableEntityException(
        `Failed to process CSV file: ${error.message}`,
      );
    }
  }
}
