import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";

interface EmployeeOfTheMonthCardProps {
  employee?: {
    name: string;
    role: string;
    image?: string | null;
    initials: string;
  };
}

export function EmployeeOfTheMonthCard({
  employee,
}: EmployeeOfTheMonthCardProps) {
  return (
    <Card className="flex flex-col justify-between h-full w-full lg:w-2/7">
      <CardContent className="flex flex-1 flex-col items-center justify-center p-4 text-center mt-6">
        <div className="relative mb-6 group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 animate-pulse" />

          {/* Crown Icon */}
          <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-10 w-10 text-primary fill-primary animate-bounce z-10 drop-shadow-md" />

          <Avatar className="h-48 w-48 rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl relative z-0 transition-transform duration-500 group-hover:scale-105">
            {employee ? (
              <>
                <AvatarImage
                  src={employee.image || ""}
                  alt={employee.name}
                  className="object-cover object-top"
                />
                <AvatarFallback>{employee.initials}</AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-muted">
                <Crown className="h-12 w-12 text-primary/40" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <CardTitle className="text-center">Employee of the Month</CardTitle>
        {employee ? (
          <>
            <h3 className="font-bold text-lg">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
          </>
        ) : (
          <>
            <h3 className="font-bold text-lg">To be announced</h3>
            <p className="text-sm text-muted-foreground">
              Keep up the great work!
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
