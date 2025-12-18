import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, FileText, ClipboardList } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Tổng ca sàng lọc', value: '1,284', icon: Activity, color: 'bg-blue-500' },
    { label: 'Bác sĩ đang trực', value: '12', icon: Users, color: 'bg-green-500' },
    { label: 'Báo cáo chờ duyệt', value: '45', icon: FileText, color: 'bg-amber-500' },
    { label: 'Lịch hẹn hôm nay', value: '28', icon: ClipboardList, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Chào mừng trở lại, {user?.full_name}!</h1>
      <p className="text-gray-500 mb-8">Đây là tổng quan về hoạt động của hệ thống AURA hôm nay.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Hoạt động gần đây</h2>
        <div className="text-center py-12 text-gray-400">
          Chưa có dữ liệu hoạt động mới.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

