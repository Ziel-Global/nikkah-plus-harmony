GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

UPDATE public.platform_settings
SET platform_name = 'Marriage Database',
    primary_color = '#2563EB',
    secondary_color = '#3B82F6',
    button_bg_color = '#2563EB',
    button_text_color = '#FFFFFF',
    button_hover_bg_color = '#1D4ED8',
    button_active_bg_color = '#1E40AF',
    success_color = '#16A34A',
    warning_color = '#D97706',
    error_color = '#DC2626'
WHERE id = 1;