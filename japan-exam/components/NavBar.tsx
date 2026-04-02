"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "หน้าแรก", icon: "🏠" },
  { href: "/flashcard", label: "บัตรคำศัพท์", icon: "🃏" },
  { href: "/quiz", label: "แบบทดสอบ", icon: "✏️" },
  { href: "/progress", label: "ความก้าวหน้า", icon: "📊" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:static md:border-t-0 md:border-b md:border-gray-200">
      <div className="max-w-2xl mx-auto px-4">
        <ul className="flex items-center justify-around md:justify-start md:gap-1 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-red-600 bg-red-50 md:bg-red-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg md:text-base">{item.icon}</span>
                  <span className="text-xs md:text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
