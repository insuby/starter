import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BlanksPage } from './pages/BlanksPage';
import { BlankDetailPage } from './pages/BlankDetailPage';
import { OperationsPage } from './pages/OperationsPage';
import { SignaturesPage } from './pages/SignaturesPage';
import { TransfersPage } from './pages/TransfersPage';
import { ReportsPage } from './pages/ReportsPage';
import { JournalPage } from './pages/JournalPage';
import { UploadPage } from './pages/UploadPage';
import { DistributionPage } from './pages/DistributionPage';
import { AdminPage } from './pages/AdminPage';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'blanks', Component: BlanksPage },
      { path: 'blanks/:id', Component: BlankDetailPage },
      { path: 'operations', Component: OperationsPage },
      { path: 'signatures', Component: SignaturesPage },
      { path: 'transfers', Component: TransfersPage },
      { path: 'reports', Component: ReportsPage },
      { path: 'journal', Component: JournalPage },
      { path: 'upload', Component: UploadPage },
      { path: 'distribution', Component: DistributionPage },
      { path: 'admin', Component: AdminPage },
      { path: '*', Component: NotFound },
    ],
  },
]);
