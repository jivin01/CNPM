// src/components/clinic/ServicePackage.tsx
import React from 'react';
import { SubscriptionPackage } from '../../types';

const packages: SubscriptionPackage[] = [
    { id: 'basic', name: 'Gói Cơ Bản', price: 500000, credits: 50, features: ['Phân tích cơ bản', 'Lưu trữ 30 ngày', 'Hỗ trợ Email'] },
    { id: 'pro', name: 'Gói Chuyên Nghiệp', price: 2000000, credits: 300, features: ['Phân tích nâng cao', 'Lưu trữ vĩnh viễn', 'API Access', 'Ưu tiên xử lý'] },
];

const ServicePackage: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-blue-600 pl-3">💳 Quản lý Gói Dịch Vụ</h2>
      
      {/* Credits Display */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-sm">
        <div className="mb-4 md:mb-0">
            <p className="text-gray-600 font-medium">Số dư Credit hiện tại:</p>
            <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-blue-800">124</p>
                <span className="text-sm font-normal text-gray-500">lượt quét còn lại</span>
            </div>
        </div>
        <button className="text-blue-700 font-semibold bg-white px-4 py-2 rounded-lg border border-blue-200 hover:shadow-md transition">
            📜 Xem lịch sử thanh toán
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {packages.map(pkg => (
            <div key={pkg.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all bg-white flex flex-col group">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600">{pkg.name}</h3>
                <div className="my-4 pb-4 border-b border-gray-100">
                    <span className="text-3xl font-extrabold text-gray-900">{pkg.price.toLocaleString()} VNĐ</span>
                    <span className="text-gray-500 text-sm"> / tháng</span>
                </div>
                <ul className="mb-6 space-y-3 flex-1">
                    <li className="flex items-center text-gray-700 text-sm font-bold bg-blue-50 p-2 rounded">
                        <span className="mr-2 text-blue-600 text-lg">★</span> {pkg.credits} lượt phân tích
                    </li>
                    {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center text-gray-600 text-sm">
                            <span className="mr-2 text-green-500 font-bold">✓</span> {feat}
                        </li>
                    ))}
                </ul>
                <button className="mt-auto w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-blue-600 transition shadow-lg transform active:scale-95">
                    Gia hạn / Mua ngay
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ServicePackage;