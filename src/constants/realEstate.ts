export const PROPERTY_TYPES = [
  'Plot',
  'Flat',
  'Villa',
  'Shop',
  'Office',
  'Independent House',
  'Farm House',
  'Warehouse',
  'Industrial Land',
  'Agriculture Land',
] as const;

export const FACING_OPTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] as const;

export const APPROVAL_TYPES = [
  'UDA',
  'SDO',
  'Agriculture',
  'JDA',
  'RERA',
  'DTCP',
  'HMDA',
  'HUDA',
  'Municipal',
  'Gram Panchayat',
] as const;

export const CONSTRUCTION_STATUSES = ['Ready to Move', 'Under Construction', 'New Launch', 'Resale'] as const;

export const ROAD_WIDTH_PRESETS_FT = [20, 30, 40, 60, 80, 100, 150] as const;

export const LEAD_SOURCES = ['Referral', 'Walk-in', 'Facebook', 'Website', 'Other'] as const;

export const LEAD_STATUSES = ['New Lead', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'] as const;

export const AREA_UNITS = ['sq ft', 'sq yd', 'sq m', 'acre', 'bigha'] as const;

export const PLOT_SIZE_OPTIONS = [
  '20*40',
  '20*50',
  '25*50',
  '30*40',
  '30*50',
  '30*60',
  '40*60',
  '50*80',
  '60*90',
  '80*120',
] as const;
