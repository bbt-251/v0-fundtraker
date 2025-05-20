"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { X } from "lucide-react";

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>
>(({ className, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={
                cn(
                    "bg-background border rounded-md shadow-sm flex flex-col pointer-events-auto border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-80 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[swipe=move]:transition-none data-[swipe=cancel]:transition-none data-[swipe=end]:transition-none",
                    className
                )
            }
            {...props}
        />
    );
});
Toast.displayName = ToastPrimitives.Root.displayName;

// Removed invalid ToastTrigger as it does not exist in @radix-ui/react-toast

import { Portal as ToastPortal } from "@radix-ui/react-portal";

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={
            cn(
                buttonVariants({ variant: "ghost" }),
                "absolute right-2 top-2 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                className
            )}
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn("mb-1 font-medium text-lg", className)}
        {...props}
    />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn("text-sm opacity-90", className)}
        {...props}
    />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={
            cn(
                "fixed inset-0 z-[100] flex flex-col-reverse p-4 pointer-events-none sm:pointer-events-auto sm:items-end sm:justify-center",
                className
            )
        }
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const ToastProvider = ToastPrimitives.Provider;

function useToast() {
    const [toasts, setToasts] = React.useState<
        {
            id: string;
            title: string;
            description?: string;
            action?: React.ReactNode;
            duration?: number;
            type?: "success" | "error" | "info";
        }[]
    >([]);

    const addToast = (
        title: string,
        type: "success" | "error" | "info" = "success",
        description?: string,
        duration: number = 5000
    ) => {
        const id = Math.random().toString(36).substring(2);
        setToasts((prev) => [...prev, { id, title, description, type, duration }]);
    };

    const dismissToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const toast = ({
        title,
        description,
        variant = "default",
        duration = 5000,
    }: {
        title: string;
        description?: string;
        variant?: "default" | "destructive" | "success" | "info";
        duration?: number;
    }) => {
        let type: "success" | "error" | "info" = "success";
        if (variant === "destructive") type = "error";
        else if (variant === "info") type = "info";

        addToast(title, type, description, duration);
    };

    return {
        toasts,
        addToast,
        dismissToast,
        toast, // Add this function to handle `variant`
        error: (title: string, description?: string) =>
            addToast(title, "error", description),
        success: (title: string, description?: string) =>
            addToast(title, "success", description),
        info: (title: string, description?: string) =>
            addToast(title, "info", description),
    };
}

function ToastContainer() {
    const { toasts, dismissToast } = useToast();

    return (
        <>
            {
                toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        duration={toast.duration}
                        onOpenChange={(open) => {
                            if (!open) dismissToast(toast.id);
                        }}
                        className={
                            cn(
                                toast.type === "success" && "bg-green-100 text-green-800",
                                toast.type === "error" && "bg-red-100 text-red-800",
                                toast.type === "info" && "bg-blue-100 text-blue-800"
                            )
                        }
                    >
                        <div className="flex items-start" >
                            <div className="flex-1" >
                                <ToastTitle>{toast.title} </ToastTitle>
                                {
                                    toast.description && (
                                        <ToastDescription>{toast.description} </ToastDescription>
                                    )
                                }
                            </div>
                            < ToastClose />
                        </div>
                    </Toast>
                ))}
            <ToastViewport />
        </>
    );
}

export {
    Toast,
    // Removed ToastTrigger
    ToastPortal,
    ToastClose,
    ToastTitle,
    ToastDescription,
    ToastViewport,
    ToastProvider,
    useToast,
    ToastContainer,
};

export type ToastProps = ToastPrimitives.ToastProps;
export type ToastActionElement = React.ReactNode;
