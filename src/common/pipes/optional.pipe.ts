import {
  type ArgumentMetadata,
  Injectable,
  ParseUUIDPipe,
  type PipeTransform,
} from '@nestjs/common';

@Injectable()
export class OptionalUUIDPipe
  implements PipeTransform<string | undefined, Promise<string | undefined>>
{
  private uuidPipe = new ParseUUIDPipe({ version: '4' });

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
