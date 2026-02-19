// @ts-nocheck
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Save, User as UserIcon, Clock, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(160, "Bio must not be longer than 160 characters.").optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      title: "",
      department: "",
      phone: "",
      bio: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        title: user.title || "",
        department: user.department || "",
        phone: user.phone || "",
        bio: user.bio || "",
        avatarUrl: user.avatar || "",
      });
    }
  }, [user, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile({
      name: data.name,
      title: data.title,
      department: data.department,
      phone: data.phone,
      bio: data.bio,
      avatar: data.avatarUrl || user?.avatar,
    });
    setIsEditing(false);
  };

  // Process history data for chart
  const historyStats = useMemo(() => {
    if (!user?.history) return [];

    const stats: Record<string, number> = {};
    
    user.history.forEach(item => {
      if (item.description.startsWith("Updated profile:")) {
        // Extract fields: "Updated profile: name, title" -> ["name", "title"]
        const fields = item.description.replace("Updated profile: ", "").split(", ");
        fields.forEach(field => {
          // Capitalize first letter
          const key = field.charAt(0).toUpperCase() + field.slice(1);
          stats[key] = (stats[key] || 0) + 1;
        });
      } else if (item.description.includes("Initial") || item.description.includes("created")) {
        stats["Login/System"] = (stats["Login/System"] || 0) + 1;
      } else {
        stats["Other"] = (stats["Other"] || 0) + 1;
      }
    });

    return Object.keys(stats).map((key, index) => ({
      name: key,
      value: stats[key],
      fill: COLORS[index % COLORS.length]
    }));
  }, [user?.history]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Form - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Update your profile information visible to the team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative group cursor-pointer">
                      <Avatar className="w-24 h-24 border-2 border-border">
                        <AvatarImage src={form.watch("avatarUrl") || user.avatar} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="w-full mt-4">
                        <FormField
                          control={form.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Avatar URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} className="text-center text-xs" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <p className="text-[10px] text-muted-foreground text-center mt-1">Paste an image URL to update avatar</p>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input disabled={!isEditing} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input value={user.email} disabled className="bg-muted" />
                      </FormControl>
                      <FormDescription className="text-xs">Email cannot be changed.</FormDescription>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input disabled={!isEditing} placeholder="+62..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input disabled={!isEditing} placeholder="e.g. Solution Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input disabled={!isEditing} placeholder="e.g. Sales" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us a little bit about yourself" 
                            className="resize-none" 
                            disabled={!isEditing}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description for your team profile.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        <UserIcon className="w-4 h-4 mr-2" /> Edit Profile
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column: Stats & History */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Change Analytics Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="w-4 h-4" /> Change Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyStats.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={historyStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {historyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                        itemStyle={{ color: '#666' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded-md">
                  No data to visualize
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History List */}
          <Card className="max-h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4" /> History Log
              </CardTitle>
              <CardDescription className="text-xs">
                Recent account activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!user.history || user.history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No history available.
                </div>
              ) : (
                <div className="space-y-4">
                  {user.history.map((item, index) => (
                    <div key={index} className="flex flex-col gap-1 border-b border-border border-dashed pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {new Date(item.date).toLocaleDateString('en-ID', {
                              day: 'numeric', month: 'short'
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.date).toLocaleTimeString('en-ID', {
                              hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-medium leading-tight pl-1 border-l-2 border-primary/20">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
