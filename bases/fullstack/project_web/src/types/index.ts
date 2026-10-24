import type { components } from './api';

type Schemas = components['schemas'];

export type User = Schemas['User'];
export type UserPage = Schemas['UserPage'];
export type AuthTokens = Schemas['AuthTokens'];
