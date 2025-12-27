// src/pages/ClinicManagerDashboard.tsx
import React from 'react';
import DoctorListTable from '../components/clinic/DoctorListTable';
import ServicePackage from '../components/clinic/ServicePackage'; // Import component bạn đã tạo trước đó

const ClinicManagerDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end pb-6 border-b border-gray-200">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">🏥 Quản lý Phòng Khám Đa Khoa X</h1>
            <p className="text-gray-500 mt-1">Tổng quan hoạt động, nhân sự và tài chính</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow">
            + Xuất báo cáo
        </button>
      </header>

      {/* Thống kê nhanh (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600 text-2xl">📊</div>
          <div>
             <p className="text-gray-500 text-sm font-medium">Tổng số ca tháng này</p>
             <p className="text-3xl font-bold text-gray-800">1,245</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-full text-green-600 text-2xl">💰</div>
          <div>
             <p className="text-gray-500 text-sm font-medium">Doanh thu ước tính</p>
             <p className="text-3xl font-bold text-gray-800">150tr VND</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center gap-4">
           <div className="p-4 bg-purple-100 rounded-full text-purple-600 text-2xl">💎</div>
           <div>
             <p className="text-gray-500 text-sm font-medium">Gói hiện tại</p>
             <p className="text-3xl font-bold text-gray-800">Pro Plan</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cột trái: Danh sách bác sĩ (Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-6">
            <DoctorListTable />
        </div>

        {/* Cột phải: Thông tin gói (Chiếm 1 phần) */}
        <div className="lg:col-span-1">
            <ServicePackage />
        </div>
      </div>
    </div>
  );
};

export default ClinicManagerDashboard;