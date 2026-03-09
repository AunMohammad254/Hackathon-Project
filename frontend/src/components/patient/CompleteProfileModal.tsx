"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/services/api";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const profileSchema = z.object({
    age: z.coerce.number().min(0, "Age must be 0 or greater").max(150),
    gender: z.enum(["Male", "Female", "Other"]),
    contact: z.string().min(5, "Contact number must be at least 5 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface CompleteProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CompleteProfileModal({ open, onOpenChange, onSuccess }: CompleteProfileModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            age: 0,
            gender: undefined, // Let the select be empty initially, or we can cast as any to bypass strict type check for initialization
            contact: "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
    });

    const onSubmit = async (values: ProfileFormValues) => {
        setIsSubmitting(true);
        try {
            await api.post("/patients/profile", values);
            toast.success("Profile completed successfully!");
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            console.error("Profile completion failed:", error);
            const axiosErr = error as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || "Failed to complete profile.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            // Prevent closing by clicking outside if they haven't submitted yet
            // to enforce completion, although we allow manual closing if needed.
            // Better UX is to let them close it if they decide not to book right now.
            if (!isSubmitting) {
                onOpenChange(newOpen);
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-teal-600" />
                        Complete Your Profile
                    </DialogTitle>
                    <DialogDescription>
                        Before booking an appointment, we need a few details to create your patient record.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        {/* Age */}
                        <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Age</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 35" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Gender */}
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gender</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Contact */}
                        <FormField
                            control={form.control}
                            name="contact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. +1 234 567 8900" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Profile"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
