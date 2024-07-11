// app/components/Sidebar.tsx
'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar: React.FC = () => {
    const pathname = usePathname();

    return (
        <div className="bg-gray-800 text-white w-64 min-h-screen p-4 flex-shrink-0">
            <h2 className="text-2xl font-bold mb-4">Menu</h2>
            <ul className="space-y-2">
                <li>
                    <Link 
                        href="/" 
                        className={`block py-2 px-4 rounded ${
                            pathname === '/' ? 'bg-gray-700' : 'hover:bg-gray-700'
                        }`}
                    >
                        Top Page
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/check-toppage" 
                        className={`block py-2 px-4 rounded ${
                            pathname === '/check-toppage' ? 'bg-gray-700' : 'hover:bg-gray-700'
                        }`}
                    >
                        Check Top Page
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/check-inputpage" 
                        className={`block py-2 px-4 rounded ${
                            pathname === '/check-inputpage' ? 'bg-gray-700' : 'hover:bg-gray-700'
                        }`}
                    >
                        Check Input Page
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;