import { z } from 'zod';
import {
  APPROVAL_TYPES,
  AREA_UNITS,
  CONSTRUCTION_STATUSES,
  FACING_OPTIONS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROPERTY_TYPES,
  ROAD_WIDTH_PRESETS_FT,
} from '../constants/realEstate.ts';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Super Admin', 'Admin', 'Sales']).optional(),
  commission_pct: z.number().min(0).max(100).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  total_land_area: z.number().optional(),
  total_plots: z.number().int().optional(),
  plot_size_options: z.string().optional(),
  description: z.string().optional(),
  amenities: z.string().optional(),
  status: z.string().optional(),
  layout_map: z.string().optional(),
  developer_name: z.string().optional(),
});

export const propertySchema = z.object({
  title: z.string().min(2),
  type: z.enum(PROPERTY_TYPES),
  location: z.string().min(2),
  price: z.number().positive(),
  area: z.number().positive(),
  plot_size: z.string().max(50).optional(),
  facing: z.enum(FACING_OPTIONS).optional(),
  approval_type: z.enum(APPROVAL_TYPES).optional(),
  road_width_ft: z.number().int().refine((v) => ROAD_WIDTH_PRESETS_FT.includes(v as any), {
    message: 'Invalid road width preset.',
  }).optional(),
  corner_plot: z.number().int().min(0).max(1).optional(),
  gated_colony: z.number().int().min(0).max(1).optional(),
  water_supply: z.number().int().min(0).max(1).optional(),
  electricity_available: z.number().int().min(0).max(1).optional(),
  sewerage_connection: z.number().int().min(0).max(1).optional(),
  property_age_years: z.number().min(0).optional(),
  construction_status: z.enum(CONSTRUCTION_STATUSES).optional(),
  map_link: z.string().url().optional().or(z.literal('')),
  status: z.enum(['Available', 'Booked', 'Sold', 'Rented']).default('Available'),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  owner_name: z.string().optional(),
  owner_contact: z.string().optional(),
  project_id: z.number().nullable().optional(),
  plot_number: z.string().optional(),
  is_standalone: z.number().int().min(0).max(1).optional(),
});

export const leadCreateSchema = z.object({
  client_id: z.number().int(),
  title: z.string().min(2),
  source: z.enum(LEAD_SOURCES),
  status: z.enum(LEAD_STATUSES).default('New Lead'),
  assigned_to: z.number().int().optional(),
  min_budget: z.number().optional(),
  max_budget: z.number().optional(),
  preferred_location: z.string().optional(),
  preferred_locations: z.array(z.string().min(1)).optional(),
  property_type: z.enum(PROPERTY_TYPES).optional(),
  property_type_interested: z.enum(PROPERTY_TYPES).optional(),
  required_area: z.number().optional(),
  required_area_value: z.number().positive().optional(),
  required_area_unit: z.enum(AREA_UNITS).optional(),
  road_requirement_ft: z.number().int().refine((v) => ROAD_WIDTH_PRESETS_FT.includes(v as any), {
    message: 'Invalid road requirement preset.',
  }).optional(),
  road_requirement_custom: z.string().max(40).optional(),
  authority_preference: z.enum(APPROVAL_TYPES).optional(),
  bhk_requirement: z.string().optional(),
  parking_requirement: z.string().optional(),
  facing_preference: z.union([z.literal('Any'), z.enum(FACING_OPTIONS)]).optional(),
  construction_status: z.enum(CONSTRUCTION_STATUSES).optional(),
  alternate_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  plot_size: z.string().max(60).optional(),
  corner_plot: z.number().int().min(0).max(1).optional(),
  road_width: z.number().int().refine((v) => ROAD_WIDTH_PRESETS_FT.includes(v as any), {
    message: 'Invalid road width preset.',
  }).optional(),
  facing: z.enum(FACING_OPTIONS).optional(),
  gated_colony: z.number().int().min(0).max(1).optional(),
  park_facing: z.number().int().min(0).max(1).optional(),
  bhk: z.number().int().min(1).max(4).optional(),
  floor_preference: z.string().max(50).optional(),
  lift_required: z.number().int().min(0).max(1).optional(),
  parking: z.number().int().min(0).max(1).optional(),
  furnishing: z.enum(['Furnished', 'Semi Furnished', 'Unfurnished']).optional(),
}).superRefine((data, ctx) => {
  if (data.min_budget && data.max_budget && data.min_budget > data.max_budget) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['max_budget'],
      message: 'Maximum budget must be greater than or equal to minimum budget.',
    });
  }
});

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().optional(),
  assigned_to: z.number().int().nullable().optional(),
  min_budget: z.number().nullable().optional(),
  max_budget: z.number().nullable().optional(),
  preferred_location: z.string().optional(),
  preferred_locations: z.array(z.string().min(1)).optional(),
  property_type: z.enum(PROPERTY_TYPES).optional(),
  property_type_interested: z.enum(PROPERTY_TYPES).optional(),
  required_area: z.number().nullable().optional(),
  required_area_value: z.number().positive().nullable().optional(),
  required_area_unit: z.enum(AREA_UNITS).nullable().optional(),
  road_requirement_ft: z.number().int().refine((v) => ROAD_WIDTH_PRESETS_FT.includes(v as any), {
    message: 'Invalid road requirement preset.',
  }).nullable().optional(),
  road_requirement_custom: z.string().max(40).optional(),
  authority_preference: z.enum(APPROVAL_TYPES).nullable().optional(),
  bhk_requirement: z.string().optional(),
  parking_requirement: z.string().optional(),
  facing_preference: z.union([z.literal('Any'), z.enum(FACING_OPTIONS)]).optional(),
  construction_status: z.enum(CONSTRUCTION_STATUSES).optional(),
  alternate_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  plot_size: z.string().max(60).optional(),
  corner_plot: z.number().int().min(0).max(1).optional(),
  road_width: z.number().int().refine((v) => ROAD_WIDTH_PRESETS_FT.includes(v as any), {
    message: 'Invalid road width preset.',
  }).optional(),
  facing: z.enum(FACING_OPTIONS).optional(),
  gated_colony: z.number().int().min(0).max(1).optional(),
  park_facing: z.number().int().min(0).max(1).optional(),
  bhk: z.number().int().min(1).max(4).optional(),
  floor_preference: z.string().max(50).optional(),
  lift_required: z.number().int().min(0).max(1).optional(),
  parking: z.number().int().min(0).max(1).optional(),
  furnishing: z.enum(['Furnished', 'Semi Furnished', 'Unfurnished']).optional(),
});

export const followupSchema = z.object({
  followup_date: z.string().min(4),
  notes: z.string().max(600).optional(),
});

export const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10),
  type: z.enum(['Buyer', 'Seller', 'Both']),
  notes: z.string().optional(),
});

export const visitSchema = z.object({
  lead_id: z.number().int(),
  property_id: z.number().int(),
  visit_date: z.string(),
  feedback: z.string().optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled']).default('Scheduled'),
});

export const dealSchema = z.object({
  lead_id: z.number().int(),
  property_id: z.number().int(),
  broker_id: z.number().int(),
  final_value: z.number().positive(),
  commission_rate: z.number().min(0).max(100),
  closing_date: z.string(),
  status: z.enum(['Negotiation', 'Closed']).default('Closed'),
});
