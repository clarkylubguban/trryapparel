-- Add customer-facing fulfillment sub-status fields for Step 5 tracking.
-- These fields do not replace public.ops_inquiries.status, the internal pipeline,
-- Won/Lost handling, or Odoo Sales Order logic.

alter table public.ops_inquiries
  add column if not exists tracking_substatus text,
  add column if not exists tracking_note text,
  add column if not exists tracking_updated_at timestamptz;

alter table public.ops_inquiries
  drop constraint if exists ops_inquiries_tracking_substatus_check;

alter table public.ops_inquiries
  add constraint ops_inquiries_tracking_substatus_check
  check (
    tracking_substatus is null
    or tracking_substatus in (
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'completed'
    )
  );

comment on column public.ops_inquiries.tracking_substatus is
  'Customer-facing Step 5 fulfillment sub-status only. Does not alter the internal sales pipeline status.';
comment on column public.ops_inquiries.tracking_note is
  'Optional customer-facing fulfillment tracking note.';
comment on column public.ops_inquiries.tracking_updated_at is
  'Timestamp for the latest customer-facing fulfillment tracking update.';
