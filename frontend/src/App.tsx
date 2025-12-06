import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "@layouts/MainLayout";
import {
  DashboardPage,
  CoursesPage,
  SwapPage,
  VaultPage,
  MePage,
} from "./router/routes";
import LoadingSpinner from "@components/layout/LoadingSpinner";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <MainLayout />
            </Suspense>
          }
        >
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
