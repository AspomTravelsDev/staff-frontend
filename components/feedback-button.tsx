import { MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FeedbackButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110"
              asChild
            >
              <Link
                href="https://forms.gle/WeXBaHCQ3fwfFuWJ8"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquarePlus className="h-8 w-8" />
                <span className="sr-only">Feedback</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Share Feedback</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
