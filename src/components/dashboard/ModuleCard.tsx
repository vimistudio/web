import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, MessageSquare, FileImage, Users, BarChart } from "lucide-react";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

const ModuleCard = ({ id, title, description, icon, route }: ModuleCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "file-text":
        return <FileText className="h-6 w-6" />;
      case "calendar":
        return <Calendar className="h-6 w-6" />;
      case "message-square":
        return <MessageSquare className="h-6 w-6" />;
      case "file-image":
        return <FileImage className="h-6 w-6" />;
      case "users":
        return <Users className="h-6 w-6" />;
      case "bar-chart":
        return <BarChart className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <Link href={route}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-primary-50 p-3 rounded-lg text-primary-600">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ModuleCard;
