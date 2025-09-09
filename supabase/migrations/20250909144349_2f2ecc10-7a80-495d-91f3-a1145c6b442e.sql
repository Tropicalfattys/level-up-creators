-- Create a security definer function for secure job application submission
-- This adds an extra layer of validation and logging for job applications
CREATE OR REPLACE FUNCTION public.submit_job_application(
  application_name text,
  application_email text,
  application_phone text,
  job_posting_id_param uuid,
  resume_url_param text,
  portfolio_url_param text,
  github_url_param text,
  cover_letter_param text,
  social_links_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  application_id uuid;
BEGIN
  -- Basic validation
  IF application_name IS NULL OR TRIM(application_name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  IF application_email IS NULL OR TRIM(application_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  -- Validate email format (basic check)
  IF application_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check if job posting exists and is active (if provided)
  IF job_posting_id_param IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.job_postings 
    WHERE id = job_posting_id_param AND active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive job posting';
  END IF;
  
  -- Insert the application
  INSERT INTO public.job_applications (
    name, 
    email, 
    phone, 
    job_posting_id, 
    resume_url, 
    portfolio_url, 
    github_url, 
    cover_letter,
    social_links,
    status
  )
  VALUES (
    TRIM(application_name),
    LOWER(TRIM(application_email)),
    application_phone,
    job_posting_id_param,
    resume_url_param,
    portfolio_url_param,
    github_url_param,
    cover_letter_param,
    COALESCE(social_links_param, '{}'::jsonb),
    'pending'
  )
  RETURNING id INTO application_id;
  
  RETURN application_id;
END;
$$;