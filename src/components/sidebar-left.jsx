import * as React from "react"
import {
  MessageSquareText,
  SquarePen,
  NotebookPen, 
} from "lucide-react"

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import { NavFavorites } from "@/components/nav-favorites"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

// App Title Component
function AppTitle() {
  return (
    <SidebarMenu className="p-4">
      <SidebarMenuItem>
        <SidebarMenuButton
          size="xl"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <NotebookPen className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate font-semibold">DocNexus</span>
            <span className="truncate text-xs">Advanced RAG</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const data = {
  navMain: [
    {
      title: "New Chat",
      url: "#",
      icon: SquarePen,
      isActive: true,
    },
  ],
}

export function SidebarLeft({ onNewChat, ...props }) {
  const [threads, setThreads] = useState([]);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Listen for new thread events from Chat component
  useEffect(() => {
    const handleNewThread = (event) => {
      const newThread = event.detail;
      
      // Check if thread already exists (avoid duplicates)
      setThreads(prev => {
        const exists = prev.some(t => t.id === newThread.id);
        if (exists) {
          return prev;
        }
        // Add to the top of the list
        return [newThread, ...prev];
      });
    };

    window.addEventListener('newThread', handleNewThread);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('newThread', handleNewThread);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await chatAPI.getHistory();
      setThreads(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const navMainItems = data.navMain.map((item) => {
    if (item.title === "New Chat") {
      return {
        ...item,
        onClick: (e) => {
          e.preventDefault();
          onNewChat();
        }
      };
    }
    return item;
  });

  // Convert threads to favorites format
  const favoritesFromThreads = threads.map(thread => ({
    id: thread.id,
    name: thread.title,
    url: `/chat/${thread.id}`,
    icon: MessageSquareText,
    date: thread.date,
  }));

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <AppTitle />
        {/* STYLING UPDATE: Added padding p-4 from Demo */}
        <NavMain className="p-4" items={navMainItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={favoritesFromThreads} navigate={navigate} />
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button onClick={logout} variant="outline" className="w-full">
          Logout
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}