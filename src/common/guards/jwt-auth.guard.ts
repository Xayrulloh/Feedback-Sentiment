import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Give proper Scopes to inject
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
