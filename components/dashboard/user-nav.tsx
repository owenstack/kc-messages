import { userProfile } from "@/actions/telegram";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuContent} from "../ui/dropdown-menu";
import Link from "next/link";

export async function UserNav() {
    const { data } = await userProfile()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar>
                    <AvatarFallback>{data?.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{data?.firstName}</DropdownMenuLabel>
                <DropdownMenuItem>
                    <Link href="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                <DropdownMenuItem>
                    <Link href="/dashboard/settings">Settings</Link>
                    </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}