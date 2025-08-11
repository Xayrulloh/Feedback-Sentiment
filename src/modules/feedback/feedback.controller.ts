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
import { 
    ApiBearerAuth, 
    ApiBody, 
    ApiConsumes, 
    ApiCreatedResponse, 
    ApiOperation, 
    ApiResponse, 
    ApiTags 
} from '@nestjs/swagger';
import { 
    FeedbackRequestDto, 
    FeedbackResponseDto, 
    FeedbackArrayResponseDto, 
    FeedbackArrayResponseSchema 
} from './dto/feedback.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTPayloadType } from '../auth/dto/auth.dto';
import type { UserSchemaType } from 'src/utils/zod.schemas';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ALLOWED_MIME_TYPES } from 'src/utils/constants';

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

    @UseGuards(AuthGuard('jwt'))
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ 
        summary: 'Upload CSV feedback file',
        description: 'Upload a CSV file containing feedback data for processing'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'CSV file containing feedback data'
                }
            }
        }
    })
    @ApiCreatedResponse({
        type: FeedbackArrayResponseDto,
        description: 'Array of processed feedback items from uploaded file'
    })
    @ZodSerializerDto(FeedbackArrayResponseSchema)
    async uploadFeedback(
        @UploadedFile() file: Express.Multer.File, 
        @Req() req: Request & {user: UserSchemaType}
    ) {
        if (!file) {
            throw new UnprocessableEntityException('No file uploaded');
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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

        const user = req.user;

        try {
            const feedbacks = await this.feedbackService.processFeedbackFile(file);
            const result = await this.feedbackService.processFeedback(feedbacks, user);
            
            return result;
        } catch (error) {
            console.error('Error processing feedback file:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new UnprocessableEntityException(
                `Failed to process CSV file: ${error.message}`,
            );
        }
    }
}