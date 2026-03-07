import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Broker']).optional(),
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
  type: z.string(),
  location: z.string().min(2),
  price: z.number().positive(),
  area: z.number().positive(),
  facing: z.string().optional(),
  status: z.enum(['Available', 'Booked', 'Sold', 'Rented']).default('Available'),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  owner_name: z.string().optional(),
  owner_contact: z.string().optional(),
  project_id: z.number().nullable().optional(),
  plot_number: z.string().optional(),
  is_standalone: z.number().int().min(0).max(1).optional(),
});

export const leadSchema = z.object({
  client_id: z.number().int(),
  title: z.string().min(2),
  source: z.string(),
  status: z.string().default('New'),
  assigned_to: z.number().int().optional(),
  min_budget: z.number().optional(),
  max_budget: z.number().optional(),
  preferred_location: z.string().optional(),
  property_type: z.string().optional(),
  required_area: z.number().optional(),
  bhk_requirement: z.string().optional(),
  parking_requirement: z.string().optional(),
  facing_preference: z.string().optional(),
  construction_status: z.string().optional(),
  alternate_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
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
