import React from 'react';
import DoctorListTable from '../components/clinic/DoctorListTable';
import ServicePackage from '../components/clinic/ServicePackage';

const ClinicManagerDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-end pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🏥 Quản Lý Phòng Khám</h1>
          <p className="text-gray-500 mt-1">Quản lý nhân sự, gói dịch vụ và doanh thu</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow transition">Xuất báo cáo</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-2xl text-2xl">📊</div>
          <div><p className="text-gray-500 text-sm">Số ca tháng này</p><p className="text-3xl font-bold">1,245</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50 flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-2xl text-2xl">💰</div>
          <div><p className="text-gray-500 text-sm">Doanh thu</p><p className="text-3xl font-bold">150tr ₫</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-50 flex items-center gap-4">
          <div className="p-4 bg-purple-100 rounded-2xl text-2xl">💎</div>
          <div><p className="text-gray-500 text-sm">Gói dịch vụ</p><p className="text-3xl font-bold">Pro Plan</p></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2"><DoctorListTable /></div>
        <div className="lg:col-span-1"><ServicePackage /></div>
      </div>
    </div>
  );
};

export default ClinicManagerDashboard;