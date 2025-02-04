import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h1 className="text-center text-3xl font-bold">Спортивный Инвентарь Школы</h1>
          <p className="mt-2 text-center text-gray-600">Эффективное управление спортивным оборудованием</p>
        </div>
        <div className="space-y-4">
          <Link
            to="/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Войти
          </Link>
          <Link
            to="/register"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}