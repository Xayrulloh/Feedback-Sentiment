import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  UserQueryDto,
  UserResponseSchemaType,
  UserSearchQueryDto,
  UserSearchResponseSchemaType,
} from './dto/user.dto';

// Give proper Scopes to inject
@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getAllUsers(query: UserQueryDto): Promise<UserResponseSchemaType> {
    const { limit, page } = query;

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.usersSchema);

    const total = totalResult[0]?.count ?? 0;

    // TODO: just call it users
    // FIXME: Use query
    const allUsers = await this.db
      .select()
      .from(schema.usersSchema)
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      users: allUsers,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(
    query: UserSearchQueryDto,
  ): Promise<UserSearchResponseSchemaType> {
    const { email } = query;
    const searchTerm = `%${email.trim()}%`;

    // TODO: use query
    const users = await this.db
      .select()
      .from(schema.usersSchema)
      .where(sql`email ILIKE ${searchTerm}`)
      .limit(5);

    return users;
  }
}
