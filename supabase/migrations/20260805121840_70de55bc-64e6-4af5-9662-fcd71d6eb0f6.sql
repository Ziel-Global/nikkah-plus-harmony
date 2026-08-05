GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

UPDATE public.platform_settings
SET platform_name = 'Nikkah+',
    primary_color = '#6B1E2A',
    secondary_color = '#C9967A',
    button_bg_color = '#6B1E2A',
    button_text_color = '#FBF6F0',
    button_hover_bg_color = '#551722',
    button_active_bg_color = '#43121B',
    success_color = '#2F7A54',
    warning_color = '#B4761F',
    error_color = '#A83232'
WHERE id = 1;