"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Check, Clock, Download, ExternalLink, Filter, PlusCircle, Search, Settings, User } from "lucide-react";
import ProjectCard from "@/components/dashboard/ProjectCard";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { projects } from "@/lib/data";

export default function Components() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const exampleProject = projects[0];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 p-6 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Component Library</h1>
            
            {/* Buttons Section */}
            <section className="mb-12">
              <div className="border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold">Buttons</h2>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Default</h3>
                    <Button>Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Secondary</h3>
                    <Button variant="secondary">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Destructive</h3>
                    <Button variant="destructive">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Outline</h3>
                    <Button variant="outline">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Ghost</h3>
                    <Button variant="ghost">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Link</h3>
                    <Button variant="link">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">With Icon</h3>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Button
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Small</h3>
                    <Button size="sm">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Large</h3>
                    <Button size="lg">Button</Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Icon</h3>
                    <Button size="icon" aria-label="Settings">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Primary Gradient</h3>
                    <Button className="bg-gradient-to-r from-[#6368EB] via-[#A35EE9] to-[#DD5A98] hover:opacity-90">
                      Button
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Disabled</h3>
                    <Button disabled>Button</Button>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Cards Section */}
            <section className="mb-12">
              <div className="border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold">Cards</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Card</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Card Content</p>
                    </CardContent>
                    <CardFooter>
                      <p>Card Footer</p>
                    </CardFooter>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Project Card</h3>
                  <ProjectCard project={exampleProject} />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Module Card</h3>
                  <ModuleCard
                    id="module-1"
                    title="File Management"
                    description="Upload and manage your project files"
                    icon="file-text"
                    route="/portal/files"
                  />
                </div>
              </div>
            </section>
            
            {/* Form Elements */}
            <section className="mb-12">
              <div className="border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold">Form Elements</h2>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="Email" type="email" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" placeholder="Password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search">Search with Icon</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="search" placeholder="Search..." className="pl-10" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="select">Select</Label>
                    <Select>
                      <SelectTrigger id="select">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="textarea">Textarea</Label>
                    <Textarea id="textarea" placeholder="Enter your message here." />
                  </div>
                </div>
              </div>
            </section>
            
            {/* Status Elements */}
            <section className="mb-12">
              <div className="border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold">Status Indicators</h2>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="flex flex-col items-center">
                    <StatusBadge status="Upcoming" />
                    <p className="text-sm mt-2">Upcoming</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <StatusBadge status="In Progress" />
                    <p className="text-sm mt-2">In Progress</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <StatusBadge status="On Hold" />
                    <p className="text-sm mt-2">On Hold</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <StatusBadge status="Complete" />
                    <p className="text-sm mt-2">Complete</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <StatusBadge status="Archived" />
                    <p className="text-sm mt-2">Archived</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Avatar & Icons */}
            <section className="mb-12">
              <div className="border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold">Avatars & Icons</h2>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Avatars</h3>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Avatar>
                          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <p className="text-xs mt-2">With Image</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Avatar>
                          <AvatarFallback className="bg-primary-400 text-white">JD</AvatarFallback>
                        </Avatar>
                        <p className="text-xs mt-2">Fallback</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-400 flex items-center justify-center text-white font-medium text-sm">
                          PM
                        </div>
                        <p className="text-xs mt-2">Custom</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Icons</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      <div className="flex flex-col items-center">
                        <User className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">User</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Settings className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Settings</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Calendar className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Calendar</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Search className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Search</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Check className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Check</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Download className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Download</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Clock className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Clock</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Filter className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">Filter</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <ExternalLink className="h-6 w-6 text-gray-700" />
                        <p className="text-xs mt-1">ExternalLink</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
