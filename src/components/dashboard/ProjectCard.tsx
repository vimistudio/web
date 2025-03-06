import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import { Project } from "@/lib/data";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Link href={`/portal/projects/${project.id}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">{project.name}</h3>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Due: {project.dueDate}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              <span>Last updated: {project.lastUpdated}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex -space-x-2">
            {project.team.map((member, index) => (
              <div 
                key={index}
                className="h-8 w-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs border-2 border-white"
                title={member.name}
              >
                {member.initials}
              </div>
            ))}
          </div>
          <div className="text-sm font-medium">
            {project.progress}% Complete
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProjectCard;
