import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { FeedbackRequestDto, FeedbackResponseDto, FeedbackResponseSchema } from './dto/feedback.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTPayloadType } from '../auth/dto/auth.dto';
import type { UserSchemaType } from 'src/utils/zod.schemas';
import type { Request } from 'express';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
    constructor(
        private readonly feedbackService: FeedbackService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('manual')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({type: FeedbackResponseDto})
    @ZodSerializerDto(FeedbackResponseSchema)
    async processManualFeedback(@Body() body: FeedbackRequestDto, @Req() req: Request &  {user: UserSchemaType} ) {
        const user = req.user;
        return this.feedbackService.processFeedback(body, user)
    }
}