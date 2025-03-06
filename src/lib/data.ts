export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar?: string;
}

export type ProjectStatus = "Upcoming" | "In Progress" | "On Hold" | "Complete" | "Archived";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  lastUpdated: string;
  team: TeamMember[];
}

export const team: TeamMember[] = [
  {
    id: "1",
    name: "Jane Doe",
    initials: "JD",
    role: "Project Manager",
  },
  {
    id: "2",
    name: "John Smith",
    initials: "JS",
    role: "Designer",
  },
  {
    id: "3",
    name: "Alex Johnson",
    initials: "AJ",
    role: "Developer",
  },
  {
    id: "4",
    name: "Sarah Williams",
    initials: "SW",
    role: "Content Strategist",
  },
];

export const projects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description: "Complete overhaul of the company website with new branding and improved UX.",
    status: "In Progress",
    progress: 65,
    dueDate: "Dec 15, 2023",
    lastUpdated: "2 days ago",
    team: [team[0], team[1], team[2]],
  },
  {
    id: "proj-2",
    name: "Mobile App Development",
    description: "Creating a new mobile application for both iOS and Android platforms.",
    status: "Upcoming",
    progress: 0,
    dueDate: "Jan 30, 2024",
    lastUpdated: "1 week ago",
    team: [team[0], team[2], team[3]],
  },
  {
    id: "proj-3",
    name: "Brand Identity",
    description: "Developing a new brand identity including logo, color palette, and style guide.",
    status: "Complete",
    progress: 100,
    dueDate: "Nov 10, 2023",
    lastUpdated: "3 weeks ago",
    team: [team[0], team[1]],
  },
  {
    id: "proj-4",
    name: "Marketing Campaign",
    description: "Planning and executing a multi-channel marketing campaign for product launch.",
    status: "On Hold",
    progress: 30,
    dueDate: "Feb 15, 2024",
    lastUpdated: "5 days ago",
    team: [team[0], team[3]],
  },
];
