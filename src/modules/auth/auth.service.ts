import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { schema } from 'src/database/schema';
import * as bcrypt from 'bcrypt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';

import { and, eq, isNull } from 'drizzle-orm';


@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        @Inject(DrizzleAsyncProvider)
        private db: NodePgDatabase<typeof schema>
    ) {}

    async register(email: string, password: string) {
        const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });

    if(existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await this.db.insert(schema.users).values({
        email: email,
        passwordHash: passwordHash,
        role: 'user',
    }).returning();

     return this.generateTokens(newUser);

    }

    async login(email: string, password: string) {
        const user = await this.db.query.users.findFirst({
            where: and(
                eq(schema.users.email, email),
                isNull(schema.users.deletedAt),
            )
        })

        if(!user) throw new UnauthorizedException('Invalid credentials');

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) throw new UnauthorizedException('Invalid credentials');

        return this.generateTokens(user);

    }

    async generateTokens(user: {id: string; email: string; role: string}) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        }

        const token = await this.jwtService.signAsync(payload, {
            expiresIn: '1h',
        });

        return { 
            token,
            role: user.role,
            redirectTo: '/dashboard',
         };
    }   

}
