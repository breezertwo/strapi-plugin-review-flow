import { Page } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';

import { HomePage } from './HomePage';
import { QueryProvider } from '../components/QueryProvider';

const App = () => {
  return (
    <QueryProvider>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </QueryProvider>
  );
};

export { App };
