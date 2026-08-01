"use client";

import { useState, useEffect } from "react";
import { getEmployees, Employee } from "@/lib/api/employees";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { StaffProfileCanvas } from "@/components/social-media/staff-profile-canvas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, User, Briefcase, Phone, Image as ImageIcon } from "lucide-react";

export default function ProfileGeneratorPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await getEmployees({ limit: 100, status: "Active" });
        if (res && res.items) {
          setEmployees(res.items);
        }
      } catch (err) {
        console.error("Failed to load employees for generator", err);
      }
    }
    loadEmployees();
  }, []);

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    if (!staffId) return;

    const staff = employees.find((e) => e.id === staffId);
    if (staff) {
      setName(`${staff.firstName} ${staff.lastName}`);
      setRole(staff.role || staff.department || "Staff Member");
      setPhone(staff.phone || "+2349071733064");
      if (staff.image_url) {
        const proxied = toProxiedImageUrl(staff.image_url);
        setImageUrl(proxied || null);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Sparkles className="h-4 w-4" /> Social Media Department Tools
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Profile Image Generator</h1>
        <p className="text-muted-foreground">
          Create, customize, and export official staff profile cards for social media platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Select or Enter Staff Details
              </CardTitle>
              <CardDescription>
                Pick a staff member to autofill details, or manually type details below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Quick Select Staff Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="staff-select">Quick Autofill from Directory</Label>
                <Select value={selectedStaffId} onValueChange={handleSelectStaff}>
                  <SelectTrigger id="staff-select">
                    <SelectValue placeholder="Choose a staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.department || emp.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-medium">Or Customize Manually</span>
                </div>
              </div>

              {/* Staff Name Input */}
              <div className="space-y-2">
                <Label htmlFor="staff-name" className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-muted-foreground" /> Staff Full Name
                </Label>
                <Input
                  id="staff-name"
                  placeholder="e.g. Damian"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Staff Role Input */}
              <div className="space-y-2">
                <Label htmlFor="staff-role" className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-muted-foreground" /> Role / Position Title
                </Label>
                <Input
                  id="staff-role"
                  placeholder="e.g. Full-Stack Developer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              {/* Phone / WhatsApp Input */}
              <div className="space-y-2">
                <Label htmlFor="staff-phone" className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" /> WhatsApp / Contact Phone Number
                </Label>
                <Input
                  id="staff-phone"
                  placeholder="e.g. +2349071733064"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-2 pt-2">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" /> Profile Photo Upload
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Upload high-res square or portrait headshots for optimal results.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Interactive Canvas Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <Card className="w-full p-6">
            <CardHeader className="px-0 pt-0 pb-4 text-center">
              <CardTitle className="text-xl">Live Graphic Preview</CardTitle>
              <CardDescription>
                High-resolution (1080x1080) social media profile card.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <StaffProfileCanvas
                name={name}
                role={role}
                phone={phone}
                imageUrl={imageUrl}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
