import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông tin cá nhân</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 h-32"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl">
                {user.full_name.charAt(0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Họ và tên</label>
                <div className="flex items-center text-gray-800">
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-lg font-medium">{user.full_name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Email</label>
                <div className="flex items-center text-gray-800">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-lg font-medium">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Vai trò</label>
                <div className="flex items-center text-gray-800">
                  <Shield className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Trạng thái</label>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-green-700 font-medium">Đang hoạt động</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

