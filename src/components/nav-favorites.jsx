"use client"

import {
  ArrowUpRight,
  Link,
  MoreHorizontal,
  StarOff,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavFavorites({ favorites, navigate }) {
  const { isMobile } = useSidebar()

  const handleThreadClick = (e, url) => {
    e.preventDefault();
    if (navigate) {
      navigate(url);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden ">
      <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          favorites.map((item) => (
            <SidebarMenuItem key={item.id || item.name}>
              <SidebarMenuButton className="p-2 h-11" asChild>
                <a 
                  href={item.url} 
                  title={item.name}
                  onClick={(e) => handleThreadClick(e, item.url)}
                >
                  {item.icon && <item.icon className="text-muted-foreground h-5 w-4" />}
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="truncate">{item.name}</span>
                    {item.date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </a>
              </SidebarMenuButton>

            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
