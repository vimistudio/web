import { cn } from "@/lib/utils";

type StatusType = "Upcoming" | "In Progress" | "On Hold" | "Complete" | "Archived";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-green-100 text-green-800";
      case "On Hold":
        return "bg-amber-100 text-amber-800";
      case "Complete":
        return "bg-purple-100 text-purple-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        getStatusStyles(),
        className
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
