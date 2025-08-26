import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type {
  UserQueryDto,
  UserResponseSchemaType,
  UserSearchQueryDto,
} from './dto/user.dto';

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
  ): Promise<UserResponseSchemaType> {
    const { page = 1, limit = 5, searchInput } = query;

    if (!searchInput?.trim()) {
      return { users: [], pagination: { limit, page, total: 0, pages: 0 } };
    }

    const searchTerm = `%${searchInput.trim()}%`;

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.usersSchema)
      .where(sql`email ILIKE ${searchTerm}`);

    const total = totalResult[0]?.count ?? 0;

    const users = await this.db
      .select()
      .from(schema.usersSchema)
      .where(sql`email ILIKE ${searchTerm}`)
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      users,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }
}
