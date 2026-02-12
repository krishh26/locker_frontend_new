"use client";

import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/store/api/user/types";

interface TrainerListProps {
  trainers: UserType[];
  selectedUser: UserType | null;
  onUserSelect: (user: UserType) => void;
  isLoading?: boolean;
}

export function TrainerList({
  trainers,
  selectedUser,
  onUserSelect,
  isLoading,
}: TrainerListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const avatarColors = [
    "bg-primary",
    "bg-secondary",
    "bg-accent",
    "bg-primary/80",
    "bg-secondary/80",
    "bg-accent/80",
    "bg-primary/60",
    "bg-secondary/60",
  ];

  return (
    <Card className="bg-primary/5 border-primary/15">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 bg-primary/15">
              <User className="h-4 w-4 text-primary" />
            </div>
            <CardTitle>Trainers</CardTitle>
          </div>
          <Badge variant="secondary" className="ml-auto bg-primary/15 text-primary">
            {trainers.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {trainers.map((trainer, index) => {
            const isSelected = selectedUser?.user_id === trainer.user_id;
            return (
              <Button
                key={trainer.user_id}
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-auto py-3 rounded-lg transition-all duration-150",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-white/60 dark:hover:bg-white/5"
                )}
                onClick={() => onUserSelect(trainer)}
              >
                <Avatar className={cn("h-10 w-10", isSelected && "ring-2 ring-primary-foreground/30")}>
                  <AvatarImage src={trainer.avatar?.url || ""} alt={trainer.first_name} />
                  <AvatarFallback className={cn("text-primary-foreground font-semibold text-sm", avatarColors[index % avatarColors.length])}>
                    {trainer.first_name[0]}
                    {trainer.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className={cn("font-medium truncate w-full", isSelected && "text-primary-foreground")}>
                    {trainer.first_name} {trainer.last_name}
                  </span>
                  <span
                    className={cn(
                      "text-sm truncate w-full",
                      isSelected
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {trainer.email}
                  </span>
                </div>
              </Button>
            );
          })}
          {trainers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No trainers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

