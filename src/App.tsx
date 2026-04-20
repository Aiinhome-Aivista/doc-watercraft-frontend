import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRouter from './routes/AppRouter';
import { useAppSelector } from './store/hooks';
import { GlobalLoader } from './components/ui';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const isLoading = useAppSelector((state) => state.loader.pendingRequests > 0);

  return (
    <>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      {isLoading && <GlobalLoader />}
      <Toaster position="top-right" />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
