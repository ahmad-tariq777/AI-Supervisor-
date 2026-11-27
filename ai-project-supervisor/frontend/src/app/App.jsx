import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../shared/context/AuthContext.jsx';
import AppRouter from '../shared/router/AppRouter.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
