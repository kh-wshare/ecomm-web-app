"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Input, Label, TextField } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

import { useHasMounted } from "@/hooks/use-has-mounted";
import {
    customerSessionQueryKey,
    getCustomerSession,
} from "@/lib/storefront/customer-session";

export function EditProfileContent() {
    const hasMounted = useHasMounted();

    const customerQuery = useQuery({
        queryKey: customerSessionQueryKey,
        queryFn: getCustomerSession,
    });

    const customer = customerQuery.data?.user;

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [saved, setSaved] = useState(false);

    // Seed the form once the real customer data has loaded.
    useEffect(() => {
        if (!customer) return;
        setFullName(customer.fullName);
        setEmail(customer.email);
        setPhone(customer.phone ?? "");
    }, [customer]);

    if (!hasMounted || customerQuery.isPending) {
        return (
            <div className="flex flex-col gap-3 pb-10 pt-6">
                <div className="h-20 animate-pulse rounded-full bg-default-100" />
                <div className="h-14 animate-pulse rounded-2xl bg-default-100" />
                <div className="h-14 animate-pulse rounded-2xl bg-default-100" />
                <div className="h-14 animate-pulse rounded-2xl bg-default-100" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-200 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon icon="solar:user-circle-outline" className="text-2xl" />
                </div>
                <p className="text-sm font-medium text-foreground">Sign in to edit your profile</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 pb-10 pt-6">
            <div className="flex flex-col items-center gap-3">
                <Avatar size="lg">
                    <Avatar.Image
                        alt={fullName}
                        src="https://img.heroui.chat/image/avatar?w=400&h=400&u=3"
                    />
                    <Avatar.Fallback>{fullName}</Avatar.Fallback>
                </Avatar>
            </div>

            <TextField
                value={fullName}
                onChange={(value) => {
                    setFullName(value);
                    setSaved(false);
                }}
            >
                <Label>Full name</Label>
                <Input />
            </TextField>

            <TextField
                type="email"
                value={email}
                onChange={(value) => {
                    setEmail(value);
                    setSaved(false);
                }}
            >
                <Label>Email</Label>
                <Input />
            </TextField>

            <TextField
                type="tel"
                value={phone}
                onChange={(value) => {
                    setPhone(value);
                    setSaved(false);
                }}
            >
                <Label>Phone</Label>
                <Input placeholder="Add a phone number" />
            </TextField>

            <Button
                className="mt-2 h-12 w-full text-sm font-bold text-white"
                type="button"
                variant="primary"
                onPress={() => setSaved(true)}
            >
                Save changes
            </Button>

            {saved && (
                <p className="text-center text-xs font-medium text-success">
                    Saved locally — there&apos;s no backend endpoint yet to persist profile edits.
                </p>
            )}
        </div>
    );
}
