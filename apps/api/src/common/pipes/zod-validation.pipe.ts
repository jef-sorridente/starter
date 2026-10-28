import { BadRequestException, PipeTransform } from "@nestjs/common";
import { z } from "zod";

export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      // Mesmo formato { formErrors, fieldErrors } do `.flatten()` do zod 3
      // — é o que apps/web/lib/api.ts sabe ler.
      throw new BadRequestException(z.flattenError(result.error));
    }
    return result.data;
  }
}
