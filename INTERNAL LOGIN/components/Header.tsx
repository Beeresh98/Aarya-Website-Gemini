
import React from 'react';
import { ArrowLeftIcon, MenuIcon } from './icons/Icons';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onToggleMobileSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, onToggleMobileSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 flex-shrink-0">
      {onToggleMobileSidebar && (
        <button onClick={onToggleMobileSidebar} title="Open menu" className="mr-2 p-2 rounded-full hover:bg-gray-100 text-gray-600 md:hidden">
          <MenuIcon className="w-6 h-6" />
        </button>
      )}
      {onBack && (
        <button onClick={onBack} title="Back to main menu" className="mr-2 sm:mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{title}</h2>
    </header>
  );
};

export default Header;
