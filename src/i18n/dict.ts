export type Lang = "ta" | "en";

export const dict = {
  // ---- app ----
  appName: { en: "Petition Tracking System", ta: "மனு கண்காணிப்பு அமைப்பு" },
  govt: { en: "Government of Tamil Nadu", ta: "தமிழ்நாடு அரசு" },
  formRef: { en: "Register C.F. 301", ta: "பதிவேடு C.F. 301" },

  // ---- auth ----
  signIn: { en: "Sign in", ta: "உள்நுழைக" },
  signOut: { en: "Sign out", ta: "வெளியேறு" },
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  password: { en: "Password", ta: "கடவுச்சொல்" },
  signingIn: { en: "Signing in…", ta: "உள்நுழைகிறது…" },
  loginHint: {
    en: "Authorised officers only. Contact the administrator for access.",
    ta: "அங்கீகரிக்கப்பட்ட அலுவலர்கள் மட்டும். அணுகலுக்கு நிர்வாகியை தொடர்பு கொள்ளவும்.",
  },

  // ---- nav ----
  dashboard: { en: "Dashboard", ta: "முகப்பு" },
  petitions: { en: "Petitions", ta: "மனுக்கள்" },
  newPetition: { en: "New petition", ta: "புதிய மனு" },
  administration: { en: "Administration", ta: "நிர்வாகம்" },
  departments: { en: "Departments", ta: "துறைகள்" },
  users: { en: "Users", ta: "பயனர்கள்" },
  geography: {
    en: "District / Taluk / Village",
    ta: "மாவட்டம் / வட்டம் / கிராமம்",
  },

  // ---- dashboard ----
  totalPetitions: { en: "Total petitions", ta: "மொத்த மனுக்கள்" },
  openPetitions: { en: "Open", ta: "நிலுவையில்" },
  overdue: {
    en: "Past next-action date",
    ta: "அடுத்த நடவடிக்கை நாள் தாண்டியவை",
  },
  recentPetitions: { en: "Recent petitions", ta: "சமீபத்திய மனுக்கள்" },
  welcome: { en: "Welcome", ta: "வணக்கம்" },

  // ---- statuses ----
  status: { en: "Status", ta: "நிலை" },
  status_new: { en: "New", ta: "புதியது" },
  status_assigned: { en: "Assigned", ta: "ஒதுக்கப்பட்டது" },
  status_in_progress: { en: "In progress", ta: "நடவடிக்கையில்" },
  status_resolved: { en: "Resolved", ta: "தீர்க்கப்பட்டது" },
  status_rejected: { en: "Rejected", ta: "நிராகரிக்கப்பட்டது" },

  priority: { en: "Priority", ta: "முன்னுரிமை" },
  priority_low: { en: "Low", ta: "குறைவு" },
  priority_normal: { en: "Normal", ta: "சாதாரண" },
  priority_high: { en: "High", ta: "அதிகம்" },
  priority_urgent: { en: "Urgent", ta: "அவசரம்" },

  // ---- petition fields (mapped to the register columns) ----
  petitionNo: { en: "Petition no.", ta: "மனு எண்" },
  serialNo: { en: "Serial no.", ta: "வரிசை எண்" },
  proceedingsNo: { en: "Proceedings no.", ta: "நடபடி எண்" },
  receivedDate: { en: "Date received", ta: "எழுத்தர் பெற்ற நாள்" },
  subject: { en: "Subject", ta: "தலைப்பு" },
  description: { en: "Details", ta: "விவரம்" },
  writerName: { en: "Written by", ta: "எழுதியவர் பெயர்" },
  outwardNo: { en: "Outward no.", ta: "வெளி எண்" },
  outwardDate: { en: "Outward date", ta: "வெளி நாள்" },
  actionTakenDate: { en: "Date action taken", ta: "நடவடிக்கை எடுத்த நாள்" },
  nextActionDate: {
    en: "Next action date",
    ta: "அடுத்த நடவடிக்கை எடுக்கும் நாள்",
  },
  registerRemarks: { en: "Remarks", ta: "பதிவின் தன்மை" },

  petitionerName: { en: "Petitioner name", ta: "மனுதாரர் பெயர்" },
  petitionerFather: { en: "Father / Husband name", ta: "தந்தை / கணவர் பெயர்" },
  petitionerPhone: { en: "Phone", ta: "கைபேசி எண்" },
  petitionerAddress: { en: "Address", ta: "முகவரி" },

  district: { en: "District", ta: "மாவட்டம்" },
  taluk: { en: "Taluk", ta: "வட்டம்" },
  village: { en: "Village / Division", ta: "கிராமம் / பிரிவு" },
  department: { en: "Department", ta: "துறை" },
  assignedTo: { en: "Assigned officer", ta: "பொறுப்பு அலுவலர்" },

  // ---- sections ----
  registerDetails: { en: "Register entry", ta: "பதிவேட்டு விவரம்" },
  petitionerDetails: { en: "Petitioner", ta: "மனுதாரர் விவரம்" },
  locationDetails: { en: "Location", ta: "இட விவரம்" },
  routingDetails: { en: "Forward to", ta: "அனுப்பப்படும் துறை" },
  attachments: { en: "Attachments", ta: "இணைப்புகள்" },
  history: { en: "Action history", ta: "நடவடிக்கை வரலாறு" },
  updateStatus: { en: "Update status", ta: "நிலையை புதுப்பிக்க" },

  // ---- actions ----
  search: { en: "Search", ta: "தேடு" },
  searchPlaceholder: {
    en: "Search by petition no, name, phone, subject, address…",
    ta: "மனு எண், பெயர், கைபேசி, தலைப்பு, முகவரி மூலம் தேடுங்கள்…",
  },
  filters: { en: "Filters", ta: "வடிகட்டி" },
  clear: { en: "Clear", ta: "அழி" },
  save: { en: "Save", ta: "சேமி" },
  saving: { en: "Saving…", ta: "சேமிக்கிறது…" },
  cancel: { en: "Cancel", ta: "ரத்து" },
  add: { en: "Add", ta: "சேர்" },
  edit: { en: "Edit", ta: "திருத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  update: { en: "Update", ta: "புதுப்பி" },
  comment: { en: "Comment", ta: "கருத்து" },
  addComment: { en: "Add comment", ta: "கருத்து சேர்" },
  upload: { en: "Upload file", ta: "கோப்பு பதிவேற்று" },
  uploading: { en: "Uploading…", ta: "பதிவேற்றுகிறது…" },
  download: { en: "Open", ta: "திற" },
  back: { en: "Back", ta: "பின்" },
  all: { en: "All", ta: "அனைத்தும்" },
  none: { en: "—", ta: "—" },
  optional: { en: "optional", ta: "விருப்பத்தேர்வு" },
  required: { en: "required", ta: "கட்டாயம்" },
  from: { en: "From", ta: "முதல்" },
  to: { en: "To", ta: "வரை" },
  noResults: { en: "No petitions found.", ta: "மனுக்கள் எதுவும் இல்லை." },
  loading: { en: "Loading…", ta: "ஏற்றுகிறது…" },
  createPetition: { en: "Register petition", ta: "மனுவை பதிவு செய்" },

  // ---- admin ----
  name_en: { en: "Name (English)", ta: "பெயர் (ஆங்கிலம்)" },
  name_ta: { en: "Name (Tamil)", ta: "பெயர் (தமிழ்)" },
  code: { en: "Code", ta: "குறியீடு" },
  role: { en: "Role", ta: "பணி நிலை" },
  role_admin: { en: "Administrator", ta: "நிர்வாகி" },
  role_officer: { en: "Officer", ta: "அலுவலர்" },
  designation: { en: "Designation", ta: "பதவி" },
  fullName: { en: "Full name", ta: "முழு பெயர்" },
  jurisdiction: {
    en: "Assigned villages / divisions",
    ta: "ஒதுக்கப்பட்ட கிராமங்கள் / பிரிவுகள்",
  },
  createUser: { en: "Create account", ta: "கணக்கை உருவாக்கு" },
  resetPassword: { en: "Reset password", ta: "கடவுச்சொல்லை மாற்று" },
  active: { en: "Active", ta: "செயலில்" },
  inactive: { en: "Inactive", ta: "செயலற்ற" },
  kind: { en: "Type", ta: "வகை" },
  addDistrict: { en: "Add district", ta: "மாவட்டம் சேர்" },
  addTaluk: { en: "Add taluk", ta: "வட்டம் சேர்" },
  addVillage: { en: "Add village / division", ta: "கிராமம் / பிரிவு சேர்" },
  selectDistrict: {
    en: "Select a district",
    ta: "மாவட்டத்தை தேர்ந்தெடுக்கவும்",
  },
  selectTaluk: { en: "Select a taluk", ta: "வட்டத்தை தேர்ந்தெடுக்கவும்" },
  confirmDelete: { en: "Delete this record?", ta: "இந்த பதிவை நீக்கவா?" },
  adminOnly: {
    en: "Administrator access only.",
    ta: "நிர்வாகிகளுக்கு மட்டும்.",
  },
  officerNote: {
    en: "You can update the status, add comments and attach files for petitions in your area.",
    ta: "உங்கள் பகுதி மனுக்களுக்கு நிலையை புதுப்பிக்கவும், கருத்து சேர்க்கவும், கோப்புகளை இணைக்கவும் முடியும்.",
  },
  searchGeography: { en: "Filter by name or code...", ta: "பெயர் அல்லது குறியீடு மூலம் தேடுக..." },
  bulkImport: { en: "Bulk Import", ta: "மொத்த பதிவேற்றம்" },
  downloadTemplate: { en: "Download CSV Template", ta: "மாதிரி படிவம் (CSV) பதிவிறக்கு" },
  bulkImportTitle: {
    en: "Bulk Import Geography (Districts, Taluks & Villages)",
    ta: "மாவட்டங்கள், வட்டங்கள் & கிராமங்கள் மொத்த பதிவேற்றம்",
  },
  bulkImportHint: {
    en: "Upload a CSV file or paste CSV rows. Header format: district_code, district_name_en, district_name_ta, taluk_name_en, taluk_name_ta, village_name_en, village_name_ta, kind",
    ta: "CSV கோப்பை பதிவேற்றவும் அல்லது கீழே ஒட்டவும். வடிவ தலைப்பு: district_code, district_name_en, district_name_ta, taluk_name_en, taluk_name_ta, village_name_en, village_name_ta, kind",
  },
  csvPlaceholder: { en: "Paste CSV content here...", ta: "இங்கே CSV உரையை ஒட்டவும்..." },
  processImport: { en: "Import Geography Records", ta: "பதிவேற்றத்தை தொடங்கு" },
  importSuccess: {
    en: "Successfully imported geography records!",
    ta: "மாவட்டங்கள்/வட்டங்கள்/கிராமங்கள் வெற்றிகரமாக பதிவேற்றப்பட்டன!",
  },
  importing: { en: "Importing records...", ta: "பதிவேற்றப்படுகிறது..." },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
