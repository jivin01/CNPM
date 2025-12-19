import React from 'react';
import { Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <div className="text-gray-600 font-medium">
        Hệ thống Sàng lọc Sức khỏe Võng mạc
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{user?.full_name}</div>
            <div className="text-xs text-gray-500 uppercase">{user?.role}</div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <UserIcon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

