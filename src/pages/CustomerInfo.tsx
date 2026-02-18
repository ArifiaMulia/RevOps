// @ts-nocheck
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchLarkData } from "@/lib/lark-connector";
import { useEffect, useState } from "react";
import { Home as HomeIcon, ArrowRight, Share2, Eye, Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function CustomerInfo() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchLarkData();
        setData(result);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Lark-style Header Toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-4 bg-card/50 px-4 -mx-6 -mt-6 pt-6 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>ICT | Presales & Aftersales</span>
          <span>&gt;</span>
          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
            <span className="w-3 h-3 bg-blue-500 rounded-sm flex items-center justify-center text-[8px] text-white">B</span>
            DRS All Project [Arifia]
          </span>
          <Badge variant="secondary" className="text-[10px] h-5">External</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8">
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button variant="outline" size="sm" className="h-8">Exit Editing</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Dashboard Canvas Area - Replicating the Screenshot Layout */}
      <div className="bg-[#F5F6F7] p-6 rounded-lg min-h-[80vh] grid gap-6">
        
        {/* Dashboard Title Area */}
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-3">
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <HomeIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-medium text-sm">Home</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
          <div className="col-span-9 bg-[#FFF6E9] rounded-lg p-6 flex items-center justify-center border border-[#FFE4C4]">
            <h1 className="text-3xl font-bold text-slate-800">Customer Info</h1>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Filter Block */}
          <div className="col-span-3">
            <Card className="h-full border-blue-500 border-2 shadow-none bg-white">
              <CardContent className="p-4 flex flex-col justify-center h-full gap-3 relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                </div>
                <div className="bg-slate-100 rounded-md p-3 flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-slate-600">Customer</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="bg-red-100 text-red-600 hover:bg-red-200 gap-1 pl-1 pr-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> High Churn Risk
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-600 hover:bg-slate-300">
                      +2
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metric Cards */}
          <div className="col-span-3">
            <Card className="h-full border-none shadow-sm bg-[#EBF6F8]">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-1">Total ARR</p>
                <p className="text-3xl font-bold text-slate-800">{data?.arr?.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-3">
            <Card className="h-full border-none shadow-sm bg-[#FFF6E5]">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-1">Total Account</p>
                <p className="text-3xl font-bold text-slate-800">{data?.accounts}</p>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-3">
            <Card className="h-full border-none shadow-sm bg-[#F0F4FF]">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-slate-800">{data?.users?.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <Card className="border-none shadow-sm bg-[#EBF1FF] h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-700 text-lg">%ARR By Churn Risk</h3>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF5350]"></span> High Churn Risk</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFCA28]"></span> Mid Churn Risk</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#66BB6A]"></span> Low Churn Risk</div>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.churn_distribution} stackOffset="expand">
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#64748B', angle: -45, textAnchor: 'end'}} 
                        height={60}
                      />
                      <YAxis 
                        tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{fontSize: 11, fill: '#64748B'}}
                      />
                      <Tooltip />
                      <Bar dataKey="high" stackId="a" fill="#EF5350" />
                      <Bar dataKey="mid" stackId="a" fill="#FFCA28" />
                      <Bar dataKey="low" stackId="a" fill="#66BB6A" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legend / Info Panel */}
          <div className="col-span-3">
            <Card className="h-full border-none shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF5350] mt-1.5 shrink-0"></span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">High:</span> %Adoption &lt;60% OR Duration &lt;50
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#66BB6A] mt-1.5 shrink-0"></span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">Low:</span> %Adoption &gt;90% AND Duration &gt;75
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FFCA28] mt-1.5 shrink-0"></span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">Mid:</span> Neither of the above conditions is met
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-700">%Adoption</span> = #Avg. Last 7 Weekdays Daily Active Users (DAU) / #Total Licenses Purchased
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-700">Duration</span> = Avg. Last 7 Weekdays Time Spent Per User Per Day (mins)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Button className="w-fit bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" /> Add Block
        </Button>

      </div>
    </div>
  );
}
