import { 
    Controller, 
    Post, 
    Body, 
    UseGuards, 
    Req, 
    HttpCode, 
    HttpStatus,
    HttpException,
    InternalServerErrorException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { FeedbackRequestDto, FeedbackResponseDto, FeedbackArrayResponseDto, FeedbackArrayResponseSchema } from './dto/feedback.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTPayloadType } from '../auth/dto/auth.dto';
import type { UserSchemaType } from 'src/utils/zod.schemas';
import type { Request } from 'express';

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
}