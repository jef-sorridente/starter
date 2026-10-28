import { z } from "zod";

// ------------------------------------------------------------
// Paginação — offset-based (page/limit), usada em toda listagem que
// cresce sem limite. Listagem naturalmente limitada (ex.: um mês) não
// precisa paginar.
// ------------------------------------------------------------

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
