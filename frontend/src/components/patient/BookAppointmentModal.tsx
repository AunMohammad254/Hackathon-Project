"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import api from "@/services/api";
import { toast } from "sonner";
import { CalendarIcon, Loader2, UserRound, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CompleteProfileModal } from "@/components/patient/CompleteProfileModal";
import { Calendar } from "@/components/ui/calendar";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Doctor {
    _id: string;
    name: string;
    email: string;
}

const formSchema = z.object({
    doctorId: z.string({
        message: "Please select a doctor.",
    }).min(1, "Please select a doctor."),
    date: z.date({
        message: "Please select a date and time.",
    }).refine((date) => date > new Date(), {
        message: "Appointment time must be in the future.",
    }),
});

interface BookAppointmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

// Generate available time slots (e.g., 9 AM to 5 PM, every 30 mins)
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
        for (const minute of [0, 30]) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function BookAppointmentModal({ open, onOpenChange, onSuccess }: BookAppointmentModalProps) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
            const response = await api.get("/users/doctors");
            setDoctors(response.data);
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
            toast.error("Could not load available doctors.");
        } finally {
            setLoadingDoctors(false);
        }
    };

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchDoctors();
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // SEC: patientId is intentionally NOT sent. Backend derives it from JWT.
            await api.post("/appointments", {
                doctorId: values.doctorId,
                date: values.date.toISOString(),
            });

            toast.success("Appointment booked successfully!");
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            console.error("Booking failed:", error);
            const axiosErr = error as { response?: { status?: number; data?: { message?: string } } };
            if (axiosErr.response?.status === 404 && axiosErr.response?.data?.message === 'Patient profile incomplete') {
                setIsProfileModalOpen(true);
            } else {
                toast.error(axiosErr.response?.data?.message || "Failed to book appointment.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-teal-600" />
                        Book a Visit
                    </DialogTitle>
                    <DialogDescription>
                        Select a specialist and your preferred time for the consultation.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">

                        {/* Doctor Selection */}
                        <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Doctor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={cn("w-full", !field.value && "text-muted-foreground")}>
                                                <div className="flex items-center gap-2">
                                                    <UserRound className="w-4 h-4 opacity-50" />
                                                    <SelectValue placeholder={loadingDoctors ? "Loading..." : "Choose a specialist"} />
                                                </div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {doctors.map((doctor) => (
                                                <SelectItem key={doctor._id} value={doctor._id}>
                                                    Dr. {doctor.name}
                                                </SelectItem>
                                            ))}
                                            {doctors.length === 0 && !loadingDoctors && (
                                                <div className="p-2 text-sm text-slate-500 text-center">No doctors available.</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date and Time Selection */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date & Time</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP 'at' h:mm a")
                                                    ) : (
                                                        <span>Pick a date and time</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 flex align-start" align="start">
                                            {/* Calendar Picker */}
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    // Preserve time if already selected, otherwise set to 9:00 AM
                                                    if (date) {
                                                        const newDate = new Date(date);
                                                        if (field.value) {
                                                            newDate.setHours(field.value.getHours(), field.value.getMinutes());
                                                        } else {
                                                            newDate.setHours(9, 0, 0, 0);
                                                        }
                                                        field.onChange(newDate);
                                                    }
                                                }}
                                                disabled={(date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                            {/* Time Picker */}
                                            <div className="border-l border-slate-200 p-3 w-[120px]">
                                                <div className="text-sm font-medium mb-2 flex items-center gap-1.5 text-slate-700">
                                                    <Clock className="w-4 h-4" /> Time
                                                </div>
                                                <ScrollArea className="h-[220px]">
                                                    <div className="flex flex-col gap-1 pr-3">
                                                        {TIME_SLOTS.map((time) => {
                                                            const [hours, minutes] = time.split(':').map(Number);
                                                            const isSelected = field.value &&
                                                                field.value.getHours() === hours &&
                                                                field.value.getMinutes() === minutes;

                                                            return (
                                                                <Button
                                                                    key={time}
                                                                    type="button"
                                                                    variant={isSelected ? "default" : "ghost"}
                                                                    size="sm"
                                                                    className={cn("justify-start font-normal", isSelected && "bg-teal-600 hover:bg-teal-700")}
                                                                    onClick={() => {
                                                                        if (field.value) {
                                                                            const newDate = new Date(field.value);
                                                                            newDate.setHours(hours, minutes, 0, 0);
                                                                            field.onChange(newDate);
                                                                        } else {
                                                                            // If no date selected yet, use today but warn
                                                                            const today = new Date();
                                                                            today.setHours(hours, minutes, 0, 0);
                                                                            field.onChange(today);
                                                                            toast.info("Please select a date on the calendar as well.");
                                                                        }
                                                                    }}
                                                                >
                                                                    {format(new Date().setHours(hours, minutes), "h:mm a")}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                "Confirm Booking"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <CompleteProfileModal
            open={isProfileModalOpen}
            onOpenChange={setIsProfileModalOpen}
            onSuccess={() => {
                // Retry booking automatically once profile is created
                const values = form.getValues();
                if (values.doctorId && values.date) {
                    onSubmit(values);
                }
            }}
        />
        </>
    );
}
