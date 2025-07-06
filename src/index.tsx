import { App } from 'app';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const element = document.getElementById('root') as HTMLDivElement;
const root = createRoot(element);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
