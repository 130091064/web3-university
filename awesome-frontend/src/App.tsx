import MainLayout from '@layouts/MainLayout';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CoursesPage, DashboardPage, MePage, SwapPage, VaultPage } from './router/routes';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="swap" element={<SwapPage />} />
          <Route path="vault" element={<VaultPage />} />
          <Route path="me" element={<MePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
