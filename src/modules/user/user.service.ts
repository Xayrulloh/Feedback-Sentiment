import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  UserQueryDto,
  UserResponseDto,
  UserSearchQueryDto,
  UserSearchResponseDto,
} from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getAllUsers(query: UserQueryDto): Promise<UserResponseDto> {
    const { limit, page } = query;

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.usersSchema);

    const total = totalResult[0]?.count ?? 0;

    const users = await this.db
      .select()
      .from(schema.usersSchema)
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      users: users,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(query: UserSearchQueryDto): Promise<UserSearchResponseDto> {
    const { email } = query;
    const searchTerm = `%${email.trim()}%`;

    const users = await this.db.query.usersSchema.findMany({
      where: sql`email ILIKE ${searchTerm}`,
      limit: 5,
    });

    return users;
  }
}
