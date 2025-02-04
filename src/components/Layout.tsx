import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link to="/dashboard" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                Панель управления
              </Link>
              <Link to="/equipment" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                Оборудование
              </Link>
              <Link to="/requests" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                Заявки
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin/equipment" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                    Управление оборудованием
                  </Link>
                  <Link to="/admin/requests" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                    Управление заявками
                  </Link>
                  <Link to="/admin/purchases" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                    Закупки
                  </Link>
                  <Link to="/admin/users" className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900">
                    Пользователи
                  </Link>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}