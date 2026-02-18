// @ts-nocheck
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
import { getLarkConfig, saveLarkConfig, type LarkConfig } from "@/lib/lark-connector";
import { Save, Database, ShieldCheck, Key, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, PERMISSIONS } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Settings() {
  const { register, handleSubmit, setValue } = useForm<LarkConfig>();
  const { hasPermission } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if no permission
  useEffect(() => {
    if (!hasPermission("SETTINGS", "view")) {
      toast.error("Access Denied: You do not have permission to view Settings.");
      setLocation("/");
    }
  }, [hasPermission, setLocation]);

  useEffect(() => {
    const config = getLarkConfig();
    if (config) {
      setValue("appId", config.appId);
      setValue("appSecret", config.appSecret);
      setValue("baseToken", config.baseToken);
      setValue("tableId", config.tableId);
    }
  }, [setValue]);

  const onSubmit = (data: LarkConfig) => {
    if (!hasPermission("SETTINGS", "manage")) {
      toast.error("Permission Denied: Only administrators can modify settings.");
      return;
    }
    saveLarkConfig(data);
    toast.success("Configuration saved successfully!");
  };

  const handleSAMLSave = () => {
    if (!hasPermission("SETTINGS", "manage")) {
      toast.error("Permission Denied: Only administrators can modify settings.");
      return;
    }
    toast.success("SAML settings saved");
  };

  if (!hasPermission("SETTINGS", "view")) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Manage external integrations and security policies.</p>
      </div>

      {/* Read-only warning for non-managers */}
      {!hasPermission("SETTINGS", "manage") && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">Read-Only Access</p>
            <p className="text-xs">You are viewing these settings in read-only mode. Contact an administrator to make changes.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="lark">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lark">Lark Integration</TabsTrigger>
          <TabsTrigger value="sso">SAML 2.0 SSO</TabsTrigger>
        </TabsList>

        <TabsContent value="lark">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Lark Base Connector</CardTitle>
                  <CardDescription>Configure API access to sync data from Lark Base</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled={!hasPermission("SETTINGS", "manage")} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>App ID</Label>
                      <Input {...register("appId")} placeholder="cli_..." />
                    </div>
                    <div className="space-y-2">
                      <Label>App Secret</Label>
                      <Input {...register("appSecret")} type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Base Token</Label>
                    <Input {...register("baseToken")} placeholder="Check URL: /base/BASExxxxx" />
                    <p className="text-xs text-muted-foreground">Found in your Lark Base URL.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Table ID</Label>
                    <Input {...register("tableId")} placeholder="tblxxxxxx" />
                    <p className="text-xs text-muted-foreground">The specific table ID to fetch records from.</p>
                  </div>

                  <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm flex gap-2">
                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      Credentials are stored locally in your browser. For production use, configure a secure backend proxy to handle authentication.
                    </p>
                  </div>

                  {hasPermission("SETTINGS", "manage") && (
                    <Button type="submit" className="w-full">
                      <Save className="w-4 h-4 mr-2" /> Save Configuration
                    </Button>
                  )}
                </fieldset>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sso">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>SAML 2.0 Configuration</CardTitle>
                  <CardDescription>Configure Single Sign-On with Identity Providers (Okta, Google, Microsoft)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-md text-sm border border-amber-200">
                <strong>Note:</strong> This is a client-side configuration UI. For actual SAML enforcement, you must configure your backend Service Provider (SP) metadata with your Identity Provider (IdP).
              </div>

              <fieldset disabled={!hasPermission("SETTINGS", "manage")} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Identity Provider Single Sign-On URL</Label>
                    <Input placeholder="https://idp.example.com/app/sso/saml" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Identity Provider Issuer (Entity ID)</Label>
                    <Input placeholder="http://www.okta.com/exk..." />
                  </div>

                  <div className="space-y-2">
                    <Label>X.509 Certificate</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Service Provider (SP) Settings</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">ACS URL</p>
                        <p className="font-mono mt-1 break-all">https://revops.prasetia.co.id/api/auth/saml/callback</p>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Entity ID</p>
                        <p className="font-mono mt-1">prasetia-revops-hub</p>
                      </div>
                    </div>
                  </div>

                  {hasPermission("SETTINGS", "manage") && (
                    <Button className="w-full" onClick={handleSAMLSave}>
                      <Save className="w-4 h-4 mr-2" /> Save SAML Settings
                    </Button>
                  )}
                </div>
              </fieldset>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
