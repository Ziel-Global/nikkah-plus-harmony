// TEMPORARY one-time seed module for test data. Delete after use.
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const PASSWORD = 'Test@1234'

type Meta = { gender?: string; role?: string; phone?: string }

async function findUserByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit.id
    if (data.users.length < 200) return null
  }
  return null
}

async function ensureUser(email: string, meta: Meta): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  })
  if (!error && data.user) return data.user.id
  const existing = await findUserByEmail(email)
  if (existing) return existing
  throw new Error(`createUser failed for ${email}: ${error?.message}`)
}

const MOSQUES = [
  {
    name: 'Test Mosque - Downtown',
    address: '12 Market Street',
    city: 'Birmingham',
    country: 'United Kingdom',
    contact_email: 'downtown@nikkahplus-test.com',
    contact_phone: '+441210000001',
    description: 'Test mosque record for platform testing.',
  },
  {
    name: 'Test Mosque - Riverside',
    address: '48 Riverside Way',
    city: 'Manchester',
    country: 'United Kingdom',
    contact_email: 'riverside@nikkahplus-test.com',
    contact_phone: '+441210000002',
    description: 'Test mosque record for platform testing.',
  },
  {
    name: 'Test Mosque - Greenfield',
    address: '5 Greenfield Road',
    city: 'London',
    country: 'United Kingdom',
    contact_email: 'greenfield@nikkahplus-test.com',
    contact_phone: '+441210000003',
    description: 'Test mosque record for platform testing.',
  },
  {
    name: 'Test Mosque - Northgate',
    address: '90 Northgate Avenue',
    city: 'Leeds',
    country: 'United Kingdom',
    contact_email: 'northgate@nikkahplus-test.com',
    contact_phone: '+441210000004',
    description: 'Test mosque record for platform testing.',
  },
  {
    name: 'Test Mosque - Hillcrest',
    address: '3 Hillcrest Lane',
    city: 'Glasgow',
    country: 'United Kingdom',
    contact_email: 'hillcrest@nikkahplus-test.com',
    contact_phone: '+441210000005',
    description: 'Test mosque record for platform testing.',
  },
]

type MemberSpec = {
  key: string
  label: string
  email: string
  phone: string
  gender: 'male' | 'female'
  mosqueIndex: number
  affiliation: 'approved' | 'pending' | 'rejected'
  profileStatus?: 'approved' | 'submitted' | 'rejected' | 'draft'
  profile?: Record<string, unknown>
  privacy?: Record<string, string>
  wali?: Record<string, string>
}

const male = (
  n: number,
  label: string,
  mosqueIndex: number,
  affiliation: MemberSpec['affiliation'],
  profileStatus: MemberSpec['profileStatus'],
  profile: Record<string, unknown>,
  wali?: Record<string, string>,
): MemberSpec => ({
  key: `m${n}`,
  label,
  email: `test.male${n}@nikkahplus-test.com`,
  phone: `+4471000001${String(n).padStart(2, '0')}`,
  gender: 'male',
  mosqueIndex,
  affiliation,
  ...(profileStatus ? { profileStatus } : {}),
  profile,
  ...(wali ? { wali } : {}),
})

const female = (
  n: number,
  label: string,
  mosqueIndex: number,
  affiliation: MemberSpec['affiliation'],
  profileStatus: MemberSpec['profileStatus'],
  profile: Record<string, unknown>,
  privacy?: Record<string, string>,
  wali?: Record<string, string>,
): MemberSpec => ({
  key: `f${n}`,
  label,
  email: `test.female${n}@nikkahplus-test.com`,
  phone: `+4471000002${String(n).padStart(2, '0')}`,
  gender: 'female',
  mosqueIndex,
  affiliation,
  ...(profileStatus ? { profileStatus } : {}),
  profile,
  ...(privacy ? { privacy } : {}),
  ...(wali ? { wali } : {}),
})

const base = (o: Record<string, unknown>) => ({
  marital_status: 'Never married',
  country: 'United Kingdom',
  willingness_to_relocate: false,
  languages_spoken: ['English'],
  sect_or_school_of_thought: 'Hanafi',
  expected_marriage_timeline: 'Within a year',
  ...o,
})

const MEMBERS: MemberSpec[] = [
  male(1, 'Test - Yusuf Rahman', 0, 'approved', 'approved', base({
    display_name: 'Test - Yusuf Rahman', date_of_birth: '1994-03-12', nationality: 'British',
    ethnicity: 'Bangladeshi', city: 'Birmingham', area: 'Small Heath', height_cm: 178,
    appearance_description: 'Average build, keeps a short beard.',
    education_level: 'Undergraduate degree', profession: 'Software engineer',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Bengali'],
    family_origin: 'Sylhet, Bangladesh', family_values: 'Close-knit, practising household',
    household_background: 'Parents and two younger siblings living locally.',
    preferred_spouse_criteria: 'Practising, kind, family-oriented and keen to build a calm home.',
    willingness_to_relocate: true,
    personal_bio: 'I work in technology and volunteer with the mosque youth programme. Looking to marry with the intention of building a steady, faith-centred family life.',
  }), { name: 'Test - Abdul Rahman', relationship: 'Father', contact_phone: '+447100003001', contact_email: 'wali.m1@nikkahplus-test.com', approval_preferences: 'Please contact me before any meeting is arranged.' }),
  male(2, 'Test - Ibrahim Malik', 1, 'approved', 'approved', base({
    display_name: 'Test - Ibrahim Malik', date_of_birth: '1990-07-02', nationality: 'British',
    ethnicity: 'Pakistani', city: 'Manchester', area: 'Longsight', height_cm: 183,
    appearance_description: 'Tall, athletic build.',
    education_level: 'Postgraduate degree', profession: 'Pharmacist',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — growing in consistency',
    languages_spoken: ['English', 'Urdu'], sect_or_school_of_thought: 'Hanafi',
    family_origin: 'Lahore, Pakistan', family_values: 'Traditional and hospitable',
    household_background: 'Eldest of four; family runs a small business.',
    preferred_spouse_criteria: 'Someone patient, considerate and committed to her deen.',
    expected_marriage_timeline: 'Within 6 months',
    personal_bio: 'A community pharmacist who enjoys hiking and Qur’an study circles. Seeking a respectful, supportive partnership.',
  }), { name: 'Test - Kamran Malik', relationship: 'Father', contact_phone: '+447100003002', contact_email: 'wali.m2@nikkahplus-test.com', approval_preferences: 'Happy for the mosque to facilitate introductions.' }),
  male(3, 'Test - Bilal Hussain', 2, 'approved', 'approved', base({
    display_name: 'Test - Bilal Hussain', date_of_birth: '1996-11-20', nationality: 'British',
    ethnicity: 'Somali', city: 'London', area: 'Tower Hamlets', height_cm: 175,
    appearance_description: 'Slim build, wears glasses.',
    education_level: 'College / diploma', profession: 'Electrician',
    employment_status: 'Self-employed',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Somali', 'Arabic'], sect_or_school_of_thought: "Shafi'i",
    family_origin: 'Hargeisa, Somaliland', family_values: 'Faith first, strong extended family ties',
    household_background: 'Lives with his mother and sister.',
    preferred_spouse_criteria: 'Practising, honest and warm with family.',
    expected_marriage_timeline: 'As soon as the right person is found',
    personal_bio: 'Self-employed electrician, memorising the last juz. I value honesty, steady routine and time with family.',
  }), { name: 'Test - Omar Hussain', relationship: 'Uncle', contact_phone: '+447100003003', contact_email: 'wali.m3@nikkahplus-test.com', approval_preferences: 'Prefer a chaperoned first meeting at the mosque.' }),
  male(4, 'Test - Zayd Farooq', 3, 'approved', 'approved', base({
    display_name: 'Test - Zayd Farooq', date_of_birth: '1988-01-09', nationality: 'British',
    ethnicity: 'Indian', city: 'Leeds', area: 'Harehills', height_cm: 170,
    marital_status: 'Divorced',
    appearance_description: 'Medium build, clean shaven.',
    education_level: 'Undergraduate degree', profession: 'Accountant',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Moderately practising',
    languages_spoken: ['English', 'Gujarati'],
    family_origin: 'Gujarat, India', family_values: 'Quiet, respectful household',
    household_background: 'Lives independently; parents nearby.',
    preferred_spouse_criteria: 'Understanding, mature and open to a simple family life.',
    willingness_to_relocate: true, expected_marriage_timeline: 'Within a year',
    personal_bio: 'Accountant, previously married with no children. I enjoy cycling and quiet weekends, and I am looking for a sincere second chance at marriage.',
  }), { name: 'Test - Suleman Farooq', relationship: 'Brother', contact_phone: '+447100003004', contact_email: 'wali.m4@nikkahplus-test.com', approval_preferences: 'Contact by email in the first instance.' }),
  male(5, 'Test - Hamza Iqbal', 4, 'approved', 'approved', base({
    display_name: 'Test - Hamza Iqbal', date_of_birth: '1993-05-30', nationality: 'British',
    ethnicity: 'Pakistani', city: 'Glasgow', area: 'Pollokshields', height_cm: 180,
    appearance_description: 'Broad build, full beard.',
    education_level: 'Islamic studies / hifz', profession: 'Teacher',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Urdu', 'Arabic'],
    family_origin: 'Rawalpindi, Pakistan', family_values: 'Scholarly and community-minded',
    household_background: 'Family of six, active in the local mosque.',
    preferred_spouse_criteria: 'Someone who values Islamic learning and gentle family life.',
    expected_marriage_timeline: 'Within 6 months',
    personal_bio: 'Hafiz and secondary school teacher. I spend my weekends teaching children Qur’an and would like a home built on patience and learning.',
  }), { name: 'Test - Rashid Iqbal', relationship: 'Father', contact_phone: '+447100003005', contact_email: 'wali.m5@nikkahplus-test.com', approval_preferences: 'Please involve the mosque imam.' }),
  male(6, 'Test - Adam Sheikh', 0, 'approved', 'approved', base({
    display_name: 'Test - Adam Sheikh', date_of_birth: '1997-09-14', nationality: 'British',
    ethnicity: 'Mixed heritage', city: 'Birmingham', area: 'Moseley', height_cm: 174,
    appearance_description: 'Slim, tidy appearance.',
    education_level: 'Undergraduate degree', profession: 'Graphic designer',
    employment_status: 'Employed part-time',
    religious_practice_level: 'Learning and returning to the deen',
    languages_spoken: ['English'], sect_or_school_of_thought: 'No particular school',
    family_origin: 'Birmingham, UK', family_values: 'Open and supportive',
    household_background: 'Lives with his parents while studying part-time.',
    preferred_spouse_criteria: 'Patient, encouraging and growing in faith alongside me.',
    willingness_to_relocate: true, expected_marriage_timeline: 'Open — no fixed timeline',
    personal_bio: 'Designer and part-time student, returning to practising the deen after a few quiet years. Honest about where I am and where I want to be.',
  })),
  male(7, 'Test - Kareem Aziz', 1, 'approved', 'submitted', base({
    display_name: 'Test - Kareem Aziz', date_of_birth: '1992-02-18', nationality: 'British',
    ethnicity: 'Egyptian', city: 'Manchester', area: 'Rusholme', height_cm: 177,
    appearance_description: 'Average build.',
    education_level: 'Postgraduate degree', profession: 'Civil engineer',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Arabic'],
    family_origin: 'Cairo, Egypt', family_values: 'Warm and hospitable',
    household_background: 'Parents live abroad; he lives alone in Manchester.',
    preferred_spouse_criteria: 'Kind, practising and comfortable with an international family.',
    personal_bio: 'Engineer originally from Cairo, settled in Manchester. Family visits often and I would like a partner who enjoys that warmth.',
  })),
  male(8, 'Test - Musa Ahmed', 2, 'approved', 'draft', {
    display_name: 'Test - Musa Ahmed', city: 'London', country: 'United Kingdom',
  }),
  male(9, 'Test - Idris Khan (pending affiliation)', 3, 'pending', undefined, {}),
  male(10, 'Test - Nabil Choudhury (rejected affiliation)', 4, 'rejected', undefined, {}),

  female(1, 'Test - Aisha Begum', 0, 'approved', 'approved', base({
    display_name: 'Test - Aisha Begum', date_of_birth: '1996-04-22', nationality: 'British',
    ethnicity: 'Bangladeshi', city: 'Birmingham', area: 'Sparkhill', height_cm: 162,
    appearance_description: 'Wears hijab, slim build.',
    education_level: 'Undergraduate degree', profession: 'Primary school teacher',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Bengali'],
    family_origin: 'Sylhet, Bangladesh', family_values: 'Practising, education-focused',
    household_background: 'Lives with parents and one sister.',
    preferred_spouse_criteria: 'Practising, responsible and gentle in character.',
    personal_bio: 'A teacher who loves reading and helping at the weekend madrasah. Looking for a calm, faith-centred marriage with mutual respect.',
  }), { profession: 'mosque_admin_only', area: 'mosque_admin_only', household_background: 'mosque_admin_only' },
  { name: 'Test - Nurul Begum', relationship: 'Father', contact_phone: '+447100004001', contact_email: 'wali.f1@nikkahplus-test.com', approval_preferences: 'All contact through me, please.' }),
  female(2, 'Test - Fatima Noor', 1, 'approved', 'approved', base({
    display_name: 'Test - Fatima Noor', date_of_birth: '1998-08-05', nationality: 'British',
    ethnicity: 'Pakistani', city: 'Manchester', area: 'Cheetham Hill', height_cm: 158,
    appearance_description: 'Wears hijab and abaya.',
    education_level: 'College / diploma', profession: 'Dental nurse',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — growing in consistency',
    languages_spoken: ['English', 'Urdu', 'Punjabi'],
    family_origin: 'Kashmir', family_values: 'Traditional and close',
    household_background: 'Large family; grandparents live at home.',
    preferred_spouse_criteria: 'Someone settled, honest and respectful to elders.',
    willingness_to_relocate: true, expected_marriage_timeline: 'Within a year',
    personal_bio: 'Dental nurse who enjoys baking and long family gatherings. I would like a husband who is steady, humorous and practising.',
  }), { height_cm: 'mosque_admin_only', appearance_description: 'mosque_admin_only', ethnicity: 'mosque_admin_only' },
  { name: 'Test - Imran Noor', relationship: 'Brother', contact_phone: '+447100004002', contact_email: 'wali.f2@nikkahplus-test.com', approval_preferences: 'Prefer a meeting with both families present.' }),
  female(3, 'Test - Maryam Osman', 2, 'approved', 'approved', base({
    display_name: 'Test - Maryam Osman', date_of_birth: '1995-12-01', nationality: 'British',
    ethnicity: 'Somali', city: 'London', area: 'Newham', height_cm: 168,
    appearance_description: 'Tall, wears hijab.',
    education_level: 'Postgraduate degree', profession: 'Public health researcher',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Somali', 'Arabic'], sect_or_school_of_thought: "Shafi'i",
    family_origin: 'Mogadishu, Somalia', family_values: 'Faith-centred and community-driven',
    household_background: 'Lives with her mother; siblings nearby.',
    preferred_spouse_criteria: 'Practising, ambitious and emotionally mature.',
    expected_marriage_timeline: 'As soon as the right person is found',
    personal_bio: 'Researcher in public health, passionate about community wellbeing. Seeking a partner to grow with in faith and service.',
  }), { personal_bio: 'mosque_admin_only', family_origin: 'mosque_admin_only', city: 'mosque_admin_only' },
  { name: 'Test - Halima Osman', relationship: 'Mother (guardian contact)', contact_phone: '+447100004003', contact_email: 'wali.f3@nikkahplus-test.com', approval_preferences: 'Please arrange through the mosque.' }),
  female(4, 'Test - Khadija Patel', 3, 'approved', 'approved', base({
    display_name: 'Test - Khadija Patel', date_of_birth: '1993-06-17', nationality: 'British',
    ethnicity: 'Indian', city: 'Leeds', area: 'Beeston', height_cm: 155,
    marital_status: 'Widowed',
    appearance_description: 'Petite, wears hijab.',
    education_level: 'Undergraduate degree', profession: 'Pharmacy technician',
    employment_status: 'Employed part-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Gujarati'],
    family_origin: 'Surat, India', family_values: 'Gentle and faith-focused',
    household_background: 'Lives with her young son and parents.',
    preferred_spouse_criteria: 'Patient, kind and welcoming to a child.',
    expected_marriage_timeline: 'Within a year',
    personal_bio: 'Widowed with one son. I am rebuilding gently and hope to meet someone caring, dependable and family-minded.',
  }), undefined,
  { name: 'Test - Yunus Patel', relationship: 'Father', contact_phone: '+447100004004', contact_email: 'wali.f4@nikkahplus-test.com', approval_preferences: 'Contact me directly by phone.' }),
  female(5, 'Test - Zainab Ali', 4, 'approved', 'approved', base({
    display_name: 'Test - Zainab Ali', date_of_birth: '1999-02-09', nationality: 'British',
    ethnicity: 'Pakistani', city: 'Glasgow', area: 'Govanhill', height_cm: 164,
    appearance_description: 'Average build, wears hijab.',
    education_level: 'Undergraduate degree', profession: 'Junior solicitor',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — growing in consistency',
    languages_spoken: ['English', 'Urdu'],
    family_origin: 'Karachi, Pakistan', family_values: 'Ambitious and supportive',
    household_background: 'Parents and three siblings.',
    preferred_spouse_criteria: 'Someone principled who values learning and balance.',
    willingness_to_relocate: true,
    personal_bio: 'Junior solicitor, early in my career and looking for a partner who is thoughtful, principled and settled in his deen.',
  })),
  female(6, 'Test - Safiyyah Rahim', 0, 'approved', 'approved', base({
    display_name: 'Test - Safiyyah Rahim', date_of_birth: '1991-10-25', nationality: 'British',
    ethnicity: 'Arab', city: 'Birmingham', area: 'Edgbaston', height_cm: 160,
    marital_status: 'Divorced',
    appearance_description: 'Wears hijab, medium build.',
    education_level: 'Postgraduate degree', profession: 'Midwife',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Moderately practising',
    languages_spoken: ['English', 'Arabic'], sect_or_school_of_thought: 'Maliki',
    family_origin: 'Morocco', family_values: 'Warm, straightforward household',
    household_background: 'Lives independently near her sister.',
    preferred_spouse_criteria: 'Mature, communicative and respectful.',
    expected_marriage_timeline: 'Open — no fixed timeline',
    personal_bio: 'Midwife with a busy but rewarding job. Divorced, no children. I value clear communication and quiet kindness.',
  })),
  female(7, 'Test - Ruqayyah Sattar', 1, 'approved', 'rejected', base({
    display_name: 'Test - Ruqayyah Sattar', date_of_birth: '2000-01-11', nationality: 'British',
    ethnicity: 'Bangladeshi', city: 'Manchester', height_cm: 157,
    education_level: 'Secondary school', profession: 'Student',
    employment_status: 'Student',
    religious_practice_level: 'Learning and returning to the deen',
    family_origin: 'Dhaka, Bangladesh', family_values: 'Protective and caring',
    household_background: 'Lives with her parents.',
    preferred_spouse_criteria: 'Someone patient and understanding.',
    personal_bio: 'Student hoping to marry after finishing my studies.',
  })),
  female(8, 'Test - Amina Yusuf', 2, 'approved', 'submitted', base({
    display_name: 'Test - Amina Yusuf', date_of_birth: '1994-07-19', nationality: 'British',
    ethnicity: 'Nigerian', city: 'London', area: 'Croydon', height_cm: 166,
    education_level: 'Undergraduate degree', profession: 'Data analyst',
    employment_status: 'Employed full-time',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Yoruba'], sect_or_school_of_thought: 'Maliki',
    family_origin: 'Lagos, Nigeria', family_values: 'Faithful and hard-working',
    household_background: 'Lives with a cousin in south London.',
    preferred_spouse_criteria: 'Practising, hardworking and gentle.',
    willingness_to_relocate: true,
    personal_bio: 'Data analyst who volunteers at a food bank on weekends. Looking for a sincere and steady partner.',
  })),
  female(9, 'Test - Hafsa Jamil', 3, 'approved', 'approved', base({
    display_name: 'Test - Hafsa Jamil', date_of_birth: '1997-03-03', nationality: 'British',
    ethnicity: 'Pakistani', city: 'Leeds', area: 'Hyde Park', height_cm: 161,
    education_level: 'Islamic studies / hifz', profession: 'Qur’an tutor',
    employment_status: 'Self-employed',
    religious_practice_level: 'Practising — five daily prayers',
    languages_spoken: ['English', 'Urdu', 'Arabic'],
    family_origin: 'Multan, Pakistan', family_values: 'Deen-centred and modest',
    household_background: 'Lives with her parents and grandmother.',
    preferred_spouse_criteria: 'A practising man who values Qur’an and family life.',
    expected_marriage_timeline: 'Within 6 months',
    personal_bio: 'Qur’an tutor for young girls. I hope for a marriage rooted in worship, patience and mutual encouragement.',
  }), undefined,
  { name: 'Test - Jamil Ashraf', relationship: 'Father', contact_phone: '+447100004009', contact_email: 'wali.f9@nikkahplus-test.com', approval_preferences: 'Mosque-facilitated introductions only.' }),
  female(10, 'Test - Sumayyah Dar (pending affiliation)', 4, 'pending', undefined, {}),
]

export async function runSeed() {
  const log: string[] = []
  const credentials: Record<string, unknown>[] = []

  // 1. Super admins
  const superAdmins = ['contact@zielglobal.com', 'zielglobal1@gmail.com']
  const superIds: string[] = []
  for (const email of superAdmins) {
    const id = await ensureUser(email, { role: 'super_admin' })
    superIds.push(id)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'super_admin', account_status: 'active', terms_accepted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(`super admin profile: ${error.message}`)
    credentials.push({ group: 'Super Admins', label: 'Test - Platform Admin', email, password: PASSWORD })
  }
  log.push(`super admins: ${superIds.length}`)

  // 2. Mosques
  const mosqueIds: string[] = []
  for (const m of MOSQUES) {
    const { data: existing } = await supabaseAdmin
      .from('mosques').select('id').eq('name', m.name).maybeSingle()
    if (existing) { mosqueIds.push(existing.id); continue }
    const { data, error } = await supabaseAdmin
      .from('mosques')
      .insert({ ...m, status: 'active', created_by: superIds[0] ?? null })
      .select('id').single()
    if (error) throw new Error(`mosque: ${error.message}`)
    mosqueIds.push(data.id)
  }
  log.push(`mosques: ${mosqueIds.length}`)

  // 3. Mosque admins
  const adminIds: string[] = []
  for (let i = 0; i < 5; i++) {
    const email = `test.mosqueadmin${i + 1}@nikkahplus-test.com`
    const id = await ensureUser(email, { role: 'mosque_admin', phone: `+4471000005${String(i + 1).padStart(2, '0')}` })
    adminIds.push(id)
    const { error } = await supabaseAdmin.from('profiles').update({
      role: 'mosque_admin', mosque_id: mosqueIds[i]!, account_status: 'active',
      verification_method: 'email', terms_accepted_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw new Error(`mosque admin profile: ${error.message}`)
    const { data: link } = await supabaseAdmin.from('mosque_admin_mosques')
      .select('id').eq('admin_id', id).eq('mosque_id', mosqueIds[i]!).maybeSingle()
    if (!link) {
      const { error: linkErr } = await supabaseAdmin.from('mosque_admin_mosques')
        .insert({ admin_id: id, mosque_id: mosqueIds[i]!, assigned_by: superIds[0] ?? null })
      if (linkErr) throw new Error(`admin link: ${linkErr.message}`)
    }
    credentials.push({
      group: 'Mosque Admins', label: `Test - Admin (${MOSQUES[i]!.name})`,
      email, password: PASSWORD, mosque: MOSQUES[i]!.name,
    })
  }
  log.push(`mosque admins: ${adminIds.length}`)

  // 4. Members
  const userIds: Record<string, string> = {}
  const profileIds: Record<string, string> = {}
  for (const spec of MEMBERS) {
    const id = await ensureUser(spec.email, {
      gender: spec.gender,
      role: spec.gender === 'male' ? 'male_user' : 'female_user',
      phone: spec.phone,
    })
    userIds[spec.key] = id
    const { error: pErr } = await supabaseAdmin.from('profiles').update({
      gender: spec.gender,
      role: spec.gender === 'male' ? 'male_user' : 'female_user',
      phone: spec.phone,
      mosque_id: spec.affiliation === "approved" ? mosqueIds[spec.mosqueIndex]! : null,
      account_status: 'active',
      verification_method: 'email',
      phone_verified_at: new Date().toISOString(),
      terms_accepted_at: new Date().toISOString(),
    }).eq('id', id)
    if (pErr) throw new Error(`member profile ${spec.key}: ${pErr.message}`)

    const { data: aff } = await supabaseAdmin.from('mosque_affiliation_requests')
      .select('id').eq('user_id', id).maybeSingle()
    if (!aff) {
      const { error: aErr } = await supabaseAdmin.from('mosque_affiliation_requests').insert({
        user_id: id,
        mosque_id: mosqueIds[spec.mosqueIndex]!,
        status: spec.affiliation,
        ...(spec.affiliation === 'pending' ? {} : {
          reviewed_by: adminIds[spec.mosqueIndex]!,
          reviewed_at: new Date().toISOString(),
        }),
        ...(spec.affiliation === 'rejected'
          ? { rejection_reason: 'Test data: we could not verify attendance records for this member yet. Please visit the office with ID.' }
          : {}),
      })
      if (aErr) throw new Error(`affiliation ${spec.key}: ${aErr.message}`)
    }

    if (spec.affiliation === 'approved' && spec.profileStatus) {
      const { data: existingProfile } = await supabaseAdmin.from('marriage_profiles')
        .select('id').eq('user_id', id).maybeSingle()
      let mpId = existingProfile?.id
      if (!mpId) {
        const { data, error } = await supabaseAdmin.from('marriage_profiles').insert({
          user_id: id,
          ...(spec.profile as Record<string, never>),
          privacy_settings: (spec.privacy ?? {}) as never,
          status: spec.profileStatus,
          ...(spec.profileStatus === 'rejected'
            ? { rejection_reason: 'Test data: please add more detail to your family background and marriage preferences before we can approve this.' }
            : {}),
          ...(spec.profileStatus === 'approved' || spec.profileStatus === 'rejected'
            ? { reviewed_by: adminIds[spec.mosqueIndex]!, reviewed_at: new Date().toISOString() }
            : {}),
        }).select('id').single()
        if (error) throw new Error(`marriage profile ${spec.key}: ${error.message}`)
        mpId = data.id
      }
      profileIds[spec.key] = mpId
      if (spec.wali) {
        const { data: w } = await supabaseAdmin.from('wali_details')
          .select('id').eq('profile_id', mpId).maybeSingle()
        if (!w) {
          const { error: wErr } = await supabaseAdmin.from('wali_details')
            .insert({ profile_id: mpId, ...(spec.wali as Record<string, never>) })
          if (wErr) throw new Error(`wali ${spec.key}: ${wErr.message}`)
        }
      }
    }

    credentials.push({
      group: spec.gender === 'male' ? 'Male Users' : 'Female Users',
      label: spec.label,
      email: spec.email,
      password: PASSWORD,
      mosque: MOSQUES[spec.mosqueIndex]!.name,
      affiliation: spec.affiliation,
      profile_status: spec.profileStatus ?? 'none',
    })
  }
  log.push(`members: ${MEMBERS.length}`)

  // 5. Interest requests
  const mosqueOf = (key: string) => {
    const spec = MEMBERS.find((m) => m.key === key)!
    return mosqueIds[spec.mosqueIndex]!
  }
  const makeRequest = async (
    m: string, f: string, status: string, message: string, respond: boolean,
  ) => {
    const requester = userIds[m]!
    const target = userIds[f]!
    const { data: existing } = await supabaseAdmin.from('interest_requests')
      .select('id').eq('requester_id', requester).eq('target_id', target).maybeSingle()
    if (existing) return existing.id
    const { data, error } = await supabaseAdmin.from('interest_requests').insert({
      requester_id: requester, target_id: target,
      requester_mosque_id: mosqueOf(m), target_mosque_id: mosqueOf(f),
      message, status: status as never,
      ...(respond ? { responded_at: new Date().toISOString() } : {}),
    }).select('id').single()
    if (error) throw new Error(`request ${m}->${f}: ${error.message}`)
    return data.id
  }

  const reqSubmitted1 = await makeRequest('m1', 'f1', 'submitted', 'Assalamu alaikum — our families sound similar and I would value an introduction through the mosque.', false)
  const reqSubmitted2 = await makeRequest('m2', 'f2', 'submitted', 'Assalamu alaikum, I would be grateful for the chance to speak with your family.', false)
  const reqActive1 = await makeRequest('m3', 'f3', 'active_match', 'Assalamu alaikum — I would like to take this forward respectfully, with our families involved.', true)
  const reqActive2 = await makeRequest('m4', 'f4', 'active_match', 'Assalamu alaikum, thank you for considering my request.', true)
  const reqMutual = await makeRequest('m5', 'f5', 'active_match', 'Assalamu alaikum, our priorities seem aligned.', true)
  const reqDeclined = await makeRequest('m6', 'f6', 'active_match', 'Assalamu alaikum, I would appreciate an introduction.', true)
  await makeRequest('m1', 'f9', 'cancelled', 'Assalamu alaikum — withdrawing this request for now, jazakAllah khair.', true)

  // consents: one-sided on match 1, both sides on match 2
  const consent = async (requestId: string, key: string) => {
    const { data } = await supabaseAdmin.from('contact_consents')
      .select('id').eq('request_id', requestId).eq('user_id', userIds[key]!).maybeSingle()
    if (data) return
    const { error } = await supabaseAdmin.from('contact_consents')
      .insert({ request_id: requestId, user_id: userIds[key]! })
    if (error) throw new Error(`consent ${key}: ${error.message}`)
  }
  await consent(reqActive1, 'm3')
  await consent(reqActive2, 'm4')
  await consent(reqActive2, 'f4')

  // feedback -> auto-closure via trigger
  const feedback = async (requestId: string, key: string, outcome: string, notes: string) => {
    const { data } = await supabaseAdmin.from('match_feedback')
      .select('id').eq('request_id', requestId).eq('user_id', userIds[key]!).maybeSingle()
    if (data) return
    const { error } = await supabaseAdmin.from('match_feedback').insert({
      request_id: requestId, user_id: userIds[key]!,
      feedback_outcome: outcome as never, feedback_notes: notes,
    })
    if (error) throw new Error(`feedback ${key}: ${error.message}`)
  }
  await feedback(reqMutual, 'm5', 'mutual_agreement', 'Test data: both families are happy to proceed towards nikkah.')
  await feedback(reqMutual, 'f5', 'mutual_agreement', 'Test data: we have agreed to move forward with our families.')
  await feedback(reqDeclined, 'm6', 'mutual_agreement', 'Test data: I was happy to continue.')
  await feedback(reqDeclined, 'f6', 'declined', 'Test data: after speaking we felt our expectations were different.')

  // 6. Escalation + conduct report
  const { data: escExisting } = await supabaseAdmin.from('escalations')
    .select('id').eq('request_id', reqActive1).maybeSingle()
  if (!escExisting) {
    const { error } = await supabaseAdmin.from('escalations').insert({
      request_id: reqActive1, raised_by: userIds['f3']!, status: 'open',
      reason: 'Test data: I would like guidance from the mosque before arranging a family meeting.',
    })
    if (error) throw new Error(`escalation: ${error.message}`)
  }

  const reportedProfile = profileIds['m6']
  if (reportedProfile) {
    const { data: crExisting } = await supabaseAdmin.from('conduct_reports')
      .select('id').eq('reported_profile_id', reportedProfile).maybeSingle()
    if (!crExisting) {
      const { error } = await supabaseAdmin.from('conduct_reports').insert({
        reported_profile_id: reportedProfile, reported_by: adminIds[0]!, status: 'pending',
        reason: 'Test data: a member raised concerns about the tone of messages during a recent match. Please review.',
      })
      if (error) throw new Error(`conduct report: ${error.message}`)
    }
  }

  // 7. Account flag
  const { data: flagExisting } = await supabaseAdmin.from('account_flags')
    .select('id').eq('user_id', userIds['m8']!).maybeSingle()
  if (!flagExisting) {
    const { error } = await supabaseAdmin.from('account_flags').insert({
      user_id: userIds['m8']!, action_taken: 'none',
      flag_reason: 'Test data: no sign-in activity for 90 days (simulated inactivity flag).',
    })
    if (error) throw new Error(`account flag: ${error.message}`)
  }

  // 8. Notification spot-check
  const { count: notificationCount } = await supabaseAdmin
    .from('notifications').select('id', { count: 'exact', head: true })

  return {
    ok: true,
    log,
    notificationCount,
    requests: { reqSubmitted1, reqSubmitted2, reqActive1, reqActive2, reqMutual, reqDeclined },
    credentials,
  }
}
