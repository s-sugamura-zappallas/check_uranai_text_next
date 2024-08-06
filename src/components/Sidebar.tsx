'use client'

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  href: string;
  label: string;
}

const Sidebar: React.FC = () => {
    const pathname = usePathname();

    const menuItems: MenuItem[] = useMemo(() => [
        { href: '/', label: 'Top Page' },
        { href: '/check-csv', label: 'Check CSV' },
        { href: '/check-inputpage', label: 'Check Input Page' },
        { href: '/check-resultpage', label: 'Check Result Page' },
    ], []);

    return (
        <nav className="bg-gray-800 text-white w-64 min-h-screen p-4 flex-shrink-0">
            <h2 className="text-2xl font-bold mb-4">Menu</h2>
            <ul className="space-y-2">
                {menuItems.map((item) => (
                    <li key={item.href}>
                        <Link 
                            href={item.href} 
                            className={`block py-2 px-4 rounded transition-colors duration-200 ${
                                pathname === item.href ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`}
                            aria-current={pathname === item.href ? 'page' : undefined}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;