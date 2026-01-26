import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Laptop, Smartphone, Monitor } from "lucide-react";

export default function GadgetRequestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Request Equipment</h3>
        <p className="text-sm text-muted-foreground">
          Apply for new hardware or upgrades.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laptop</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              MacBook Pro, Dell XPS
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Device</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              iPhone 15, Samsung S24
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peripheral</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Monitor, Keyboard, Mouse
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Specify the device and reason for your request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="device">Preferred Model</Label>
            <Input id="device" placeholder="e.g. MacBook Pro M3 16-inch" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Business Justification</Label>
            <Textarea
              id="reason"
              placeholder="Why do you need this equipment? e.g. Current laptop is slow..."
            />
          </div>
          <Button>Submit Request</Button>
        </CardContent>
      </Card>
    </div>
  );
}
