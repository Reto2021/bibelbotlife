
-- Invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid');

-- Invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CHF',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  pdf_url text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate invoice numbers
CREATE SEQUENCE public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || EXTRACT(YEAR FROM NEW.invoice_date)::text || '-' || LPAD(nextval('public.invoice_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

-- Updated at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Church owners can view their invoices
CREATE POLICY "Church owners can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT id FROM public.church_partners WHERE owner_id = auth.uid()
    )
  );

-- Storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Admins can upload invoice PDFs
CREATE POLICY "Admins can upload invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));

-- Admins can read all invoice PDFs
CREATE POLICY "Admins can read invoice PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));

-- Church owners can read their own invoice PDFs
CREATE POLICY "Church owners can read own invoice PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.church_partners WHERE owner_id = auth.uid()
    )
  );
