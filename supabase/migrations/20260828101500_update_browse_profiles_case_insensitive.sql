create or replace function public.browse_profiles(
  p_min_age int default null,
  p_max_age int default null,
  p_country text default null,
  p_city text default null,
  p_nationality text default null,
  p_education text default null,
  p_marital text default null,
  p_practice text default null,
  p_languages text[] default null,
  p_relocate boolean default null,
  p_mosque uuid default null,
  p_profession text default null,
  p_family_keyword text default null,
  p_profile_id uuid default null,
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  display_name text,
  age int,
  country text,
  city text,
  area text,
  nationality text,
  ethnicity text,
  marital_status text,
  height_cm int,
  appearance_description text,
  education_level text,
  profession text,
  employment_status text,
  religious_practice_level text,
  sect_or_school_of_thought text,
  languages_spoken text[],
  family_origin text,
  family_values text,
  household_background text,
  preferred_spouse_criteria text,
  willingness_to_relocate boolean,
  expected_marriage_timeline text,
  personal_bio text,
  mosque_id uuid,
  mosque_name text,
  photo_url text,
  has_hidden_photo boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.id, p.gender from public.profiles p where p.id = auth.uid()
  ),
  base as (
    select mp.*, pr.mosque_id as owner_mosque_id, m.name as mosque_name,
           date_part('year', age(mp.date_of_birth))::int as calc_age
    from public.marriage_profiles mp
    join public.profiles pr on pr.id = mp.user_id
    left join public.mosques m on m.id = pr.mosque_id
    cross join me
    where mp.status = 'approved'
      and mp.user_id <> me.id
      and me.gender is not null
      and pr.gender is not null
      and pr.gender <> me.gender
      and pr.account_status = 'active'
      and (p_profile_id is null or mp.id = p_profile_id)
      and (p_min_age is null or p_min_age <= 0 or mp.date_of_birth is null or date_part('year', age(mp.date_of_birth)) >= p_min_age)
      and (p_max_age is null or p_max_age <= 0 or mp.date_of_birth is null or date_part('year', age(mp.date_of_birth)) <= p_max_age)
      and (p_country is null or mp.country ilike '%' || p_country || '%')
      and (p_city is null or mp.city ilike '%' || p_city || '%')
      and (p_nationality is null or mp.nationality ilike '%' || p_nationality || '%')
      and (p_education is null or mp.education_level ilike p_education)
      and (p_marital is null or mp.marital_status ilike p_marital)
      and (p_practice is null or mp.religious_practice_level ilike p_practice)
      and (p_languages is null or array_length(p_languages, 1) is null or exists (
            select 1 from unnest(mp.languages_spoken) lang
            where lower(lang) = any(p_languages)
          ))
      and (p_relocate is null or mp.willingness_to_relocate = p_relocate)
      and (p_mosque is null or pr.mosque_id = p_mosque)
      and (p_profession is null or mp.profession ilike '%' || p_profession || '%')
      and (p_family_keyword is null or (
            coalesce(mp.family_origin, '') || ' ' || coalesce(mp.family_values, '') || ' ' ||
            coalesce(mp.household_background, '')
          ) ilike '%' || p_family_keyword || '%')
  ),
  counted as (select count(*) as n from base)
  select
    b.id,
    b.display_name,
    b.calc_age,
    b.country,
    b.city,
    case when privacy_visible(b.privacy_settings, 'area') then b.area end,
    case when privacy_visible(b.privacy_settings, 'nationality') then b.nationality end,
    case when privacy_visible(b.privacy_settings, 'ethnicity') then b.ethnicity end,
    b.marital_status,
    case when privacy_visible(b.privacy_settings, 'height_cm') then b.height_cm end,
    case when privacy_visible(b.privacy_settings, 'appearance_description') then b.appearance_description end,
    b.education_level,
    case when privacy_visible(b.privacy_settings, 'profession') then b.profession end,
    case when privacy_visible(b.privacy_settings, 'employment_status') then b.employment_status end,
    b.religious_practice_level,
    b.sect_or_school_of_thought,
    b.languages_spoken,
    case when privacy_visible(b.privacy_settings, 'family_origin') then b.family_origin end,
    case when privacy_visible(b.privacy_settings, 'family_values') then b.family_values end,
    case when privacy_visible(b.privacy_settings, 'household_background') then b.household_background end,
    case when privacy_visible(b.privacy_settings, 'preferred_spouse_criteria') then b.preferred_spouse_criteria end,
    b.willingness_to_relocate,
    b.expected_marriage_timeline,
    case when privacy_visible(b.privacy_settings, 'personal_bio') then b.personal_bio end,
    b.owner_mosque_id,
    b.mosque_name,
    (select ph.photo_url from public.profile_photos ph
      where ph.profile_id = b.id and ph.visibility = 'public'
      order by ph.is_primary desc, ph.uploaded_at asc limit 1),
    exists (select 1 from public.profile_photos ph where ph.profile_id = b.id and ph.visibility <> 'public'),
    (select n from counted)
  from base b
  order by b.updated_at desc
  limit greatest(coalesce(p_limit, 24), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.browse_profiles(int,int,text,text,text,text,text,text,text[],boolean,uuid,text,text,uuid,int,int) from public, anon;
grant execute on function public.browse_profiles(int,int,text,text,text,text,text,text,text[],boolean,uuid,text,text,uuid,int,int) to authenticated, service_role;
