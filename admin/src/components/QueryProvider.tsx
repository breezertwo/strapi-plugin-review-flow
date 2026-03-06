import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../queryClient';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export const withQueryProvider =
  (Component: React.ComponentType): React.FC =>
  () =>
    React.createElement(QueryProvider, null, React.createElement(Component, null));
