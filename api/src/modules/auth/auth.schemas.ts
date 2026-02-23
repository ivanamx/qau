import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Correo no válido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  colonia: z.string().optional(),
});

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.email ?? data.phone, {
    message: 'Se requiere email o teléfono',
    path: ['email'],
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
  })
  .refine((data) => data.email ?? data.phone, {
    message: 'Se requiere email o teléfono',
    path: ['email'],
  });
