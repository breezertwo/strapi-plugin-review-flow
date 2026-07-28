/**
 * Every plugin endpoint wraps its payload in `{ data }`. `useFetchClient` defaults its responses
 * to `unknown`, so the call sites pass this through as the generic to keep them type checked.
 */
export type ApiResponse<T> = {
  data: T;
};
