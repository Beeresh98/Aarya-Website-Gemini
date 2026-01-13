
import React from 'react';
import { BriefcaseIcon, ChartBarIcon } from '../components/icons/Icons';

const ComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
      <div className="w-24 h-24 text-primary-300 mb-4">
        <ChartBarIcon />
      </div>
      <h2 className="text-3xl font-bold text-gray-700 mb-2">Coming Soon!</h2>
      <p className="max-w-md">
        This module is currently under development. We're working hard to bring you more features to enhance your HR management experience. Stay tuned for updates!
      </p>
    </div>
  );
};

export default ComingSoon;