import { Logo } from "../logo";
import { ThemeToggle } from "../theme-toggle";
import { UserNav } from "./user-nav";

export function NavBar() {
	return (
		<header className="w-full flex items-center justify-between gap-4 px-4 py-2 sticky top-0 border-b z-20 backdrop-blur-sm">
			<Logo />
			<div className="flex items-center gap-1">
				<UserNav />
				<ThemeToggle />
			</div>
		</header>
	);
}
