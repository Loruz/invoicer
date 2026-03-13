"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  currencies,
  updateUserSettingsSchema,
  type User,
} from "@invoicer/shared";

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState(
    user.defaultCurrency ?? "USD"
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    formData.forEach((value, key) => {
      const str = value.toString().trim();
      if (str) raw[key] = str;
    });

    raw.defaultCurrency = defaultCurrency;

    const parsed = updateUserSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      toast.error(firstError?.message ?? "Invalid form data");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong");
      }

      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                defaultValue={user.businessName ?? ""}
                placeholder="Your Company LLC"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Textarea
              id="businessAddress"
              name="businessAddress"
              defaultValue={user.businessAddress ?? ""}
              placeholder="123 Main Street&#10;New York, NY 10001&#10;United States"
              rows={3}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                name="businessEmail"
                type="email"
                defaultValue={user.businessEmail ?? ""}
                placeholder="billing@yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                name="businessPhone"
                defaultValue={user.businessPhone ?? ""}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={user.taxId ?? ""}
                placeholder="XX-XXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={(val) => val !== null && setDefaultCurrency(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mt-6">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
