import type { ComponentType, ReactNode } from 'react';

// Base44-generated UI primitives are vendor-style presentation infrastructure.
// The application build and ESLint still validate their implementation. This
// declaration keeps application typechecking focused on NPC Forge data and
// behavior contracts without requiring a local TypeScript migration of the UI kit.
type VendorProps = {
  children?: ReactNode;
  [prop: string]: unknown;
};

type VendorComponent = ComponentType<VendorProps>;

export const Button: VendorComponent;
export const Input: VendorComponent;
export const Label: VendorComponent;
export const Image: VendorComponent;
export const Toaster: VendorComponent;
export const Select: VendorComponent;
export const SelectContent: VendorComponent;
export const SelectItem: VendorComponent;
export const SelectTrigger: VendorComponent;
export const SelectValue: VendorComponent;
export const InputOTP: VendorComponent;
export const InputOTPGroup: VendorComponent;
export const InputOTPSlot: VendorComponent;
export const Sheet: VendorComponent;
export const SheetContent: VendorComponent;
export const SheetHeader: VendorComponent;
export const SheetTitle: VendorComponent;
export const SheetDescription: VendorComponent;
export const SheetFooter: VendorComponent;
export const Dialog: VendorComponent;
export const DialogContent: VendorComponent;
export const DialogHeader: VendorComponent;
export const DialogTitle: VendorComponent;
export const DialogDescription: VendorComponent;
export const DialogFooter: VendorComponent;

export function toast(options: VendorProps): unknown;
export function useToast(): { toasts: unknown[]; toast: typeof toast; dismiss(id?: string): void };
