import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FeedbackModal = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({ email: "", feedback: "" });
  const { token, user } = useAuth();

  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // lock background scroll when modal open
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const validate = () => {
    const e = { email: "", feedback: "" };
    if (!email || !email.trim()) e.email = "Email is required";
    if (!feedback || !feedback.trim()) e.feedback = "Feedback is required";
    setErrors(e);
    return !e.email && !e.feedback;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      name,
      email,
      designation,
      feedback,
      featureName: 'About Page',
      planType: user?.plan || user?.membership || null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('Feedback API responded with non-OK status');
      }
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setOpen(false);
      setName("");
      setEmail("");
      setDesignation("");
      setFeedback("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0 text-sm">
          Contact Us
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/40" />

        <RadixDialog.Content
          className={
            "fixed left-[50%] top-[50%] z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg"
          }
        >
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold">Send feedback</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">Share anything about your experience — questions, bugs, or suggestions.</DialogDescription>
              </div>
              <RadixDialog.Close className="ml-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </RadixDialog.Close>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:pr-2">
                <Label>Name <span className="text-sm text-muted-foreground">(optional)</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Name" />
              </div>

              <div className="sm:pl-2">
                <Label>Designation <span className="text-sm text-muted-foreground">(optional)</span></Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Product Manager" aria-label="Designation" />
              </div>

              <div className="sm:col-span-2">
                <Label>Email <span className="text-sm text-destructive">*</span></Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  required
                  aria-invalid={errors.email ? "true" : "false"}
                />
                <div className="text-sm text-muted-foreground">We’ll only use this to follow up about your feedback.</div>
                {errors.email && <div className="mt-1 text-sm text-destructive">{errors.email}</div>}
              </div>

              <div className="sm:col-span-2">
                <Label>Feedback <span className="text-sm text-destructive">*</span></Label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us what happened or what you'd like to see" aria-label="Feedback" className="min-h-[120px]" />
                <div className="text-sm text-muted-foreground">Please describe the issue or suggestion in a few sentences.</div>
                {errors.feedback && <div className="mt-1 text-sm text-destructive">{errors.feedback}</div>}
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <RadixDialog.Close asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </RadixDialog.Close>
                <Button type="submit">Send</Button>
              </div>
            </form>
          </div>
        </RadixDialog.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default FeedbackModal;
