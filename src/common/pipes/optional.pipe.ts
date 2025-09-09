import {
  type ArgumentMetadata,
  Injectable,
  type ParseUUIDPipe,
  type PipeTransform,
} from '@nestjs/common';

@Injectable()
export class OptionalUUIDPipe
  implements PipeTransform<string | undefined, Promise<string | undefined>>
{
  constructor(private readonly uuidPipe: ParseUUIDPipe) {}

  async transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): Promise<string | undefined> {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return this.uuidPipe.transform(value, metadata);
  }
}
