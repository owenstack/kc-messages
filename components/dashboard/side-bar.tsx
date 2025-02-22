'use client'

import { History, LayoutDashboard, Settings2, User2, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "../ui/button"
import { usePathname } from "next/navigation"

interface Link {
    name: string
    href: string
    icon: LucideIcon
}

const links: Link[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard
    },
    {
        name: 'History',
        href: '/dashboard/history',
        icon: History
    },
    {
        name: 'Profile',
        href: '/dashboard/profile',
        icon: User2
    },
    {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings2
    }
]

export function Sidebar() {
    const pathname = usePathname()
    return (
        <aside className="w-64 h-[90%] border-r flex-shrink-0">
            <nav className="p-4 space-y-2">
                <ul className="space-y-1">
                    {links.map(({name, href, icon: Icon}) => (
                        <li key={name}>
                            <Link 
                                href={href} 
                                className={buttonVariants({
                                    variant: pathname === href ? 'secondary' : 'ghost',
                                    className: 'w-full justify-start'
                                })}
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                <span>{name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}