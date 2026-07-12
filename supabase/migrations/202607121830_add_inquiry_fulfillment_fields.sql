-- Add customer fulfillment fields for TRRY customer-webapp inquiries.
-- Existing inquiry columns remain unchanged; these nullable fields allow pickup/delivery
-- display in Admin Inquiry Details and customer receipts.

alter table public.ops_inquiries
  add column if not exists fulfillment_method text,
  add column if not exists delivery_city text,
  add column if not exists delivery_address text,
  add column if not exists delivery_landmark text;

alter table public.ops_inquiries
  drop constraint if exists ops_inquiries_fulfillment_method_check;

alter table public.ops_inquiries
  add constraint ops_inquiries_fulfillment_method_check
  check (
    fulfillment_method is null
    or fulfillment_method in ('pickup', 'delivery')
  );

comment on column public.ops_inquiries.fulfillment_method is
  'Customer-selected inquiry fulfillment method: pickup or delivery.';
comment on column public.ops_inquiries.delivery_city is
  'Customer delivery city or barangay, only used when fulfillment_method = delivery.';
comment on column public.ops_inquiries.delivery_address is
  'Customer complete delivery address, only used when fulfillment_method = delivery.';
comment on column public.ops_inquiries.delivery_landmark is
  'Optional customer delivery landmark, only used when fulfillment_method = delivery.';
