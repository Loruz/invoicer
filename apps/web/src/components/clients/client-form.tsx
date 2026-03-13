"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  createClientSchema,
  type CreateClientInput,
} from "@invoicer/shared";

interface ClientFormProps {
  clientId?: string;
  initialData?: Partial<CreateClientInput>;
}

export function ClientForm({ clientId, initialData }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isEditing = !!clientId;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    formData.forEach((value, key) => {
      const str = value.toString().trim();
      if (str) raw[key] = str;
    });

    const parsed = createClientSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      toast.error(firstError?.message ?? "Invalid form data");
      setLoading(false);
      return;
    }

    try {
      const url = isEditing
        ? `/api/clients/${clientId}`
        : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong");
      }

      const client = await res.json();
      toast.success(
        isEditing ? "Client updated successfully" : "Client created successfully"
      );
      router.push(`/clients/${client.id}`);
      router.refresh();
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
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              defaultValue={initialData?.companyName ?? ""}
              placeholder="Acme Inc."
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={initialData?.contactName ?? ""}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initialData?.email ?? ""}
                placeholder="john@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialData?.phone ?? ""}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={initialData?.address ?? ""}
                placeholder="123 Main Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={initialData?.city ?? ""}
                placeholder="New York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={initialData?.postalCode ?? ""}
                placeholder="10001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={initialData?.country ?? ""}
                placeholder="United States"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={initialData?.taxId ?? ""}
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={initialData?.notes ?? ""}
              placeholder="Any additional notes about this client..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Client" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
