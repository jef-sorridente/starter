import { PaginatedResult, PaginationQuery } from "@app/shared";

export function paginationSkipTake(query: PaginationQuery) {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function buildPaginatedResult<T>(items: T[], total: number, query: PaginationQuery): PaginatedResult<T> {
  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}
