import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '../../shared/prisma.js';
import { config } from '../../shared/config.js';

const SALT_ROUNDS = 12;

export type RegisterInput = {
  email: string;
  phone: string;
  password: string;
  nombre: string;
  apellidos: string;
  colonia?: string;
};

export type LoginInput = {
  email?: string;
  phone?: string;
  password: string;
};

export async function register(input: RegisterInput) {
  const existingByEmail = await prisma.citizen.findUnique({ where: { email: input.email } });
  if (existingByEmail) throw new Error('El email ya está registrado');
  const existingByPhone = await prisma.citizen.findUnique({ where: { phone: input.phone } });
  if (existingByPhone) throw new Error('El teléfono ya está registrado');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const citizen = await prisma.citizen.create({
    data: {
      email: input.email,
      phone: input.phone,
      passwordHash,
      nombre: input.nombre.trim(),
      apellidos: input.apellidos.trim(),
      colonia: input.colonia?.trim() ?? null,
    },
  });
  const tokens = await createTokensForCitizen(citizen.id);
  return {
    ...tokens,
    user: {
      nombre: citizen.nombre ?? undefined,
      apellidos: citizen.apellidos ?? undefined,
      email: citizen.email ?? undefined,
    },
  };
}

export async function login(input: LoginInput) {
  if (!input.email && !input.phone) {
    throw new Error('Se requiere email o teléfono');
  }
  const citizen = input.email
    ? await prisma.citizen.findUnique({ where: { email: input.email } })
    : await prisma.citizen.findUnique({ where: { phone: input.phone! } });
  if (citizen) {
    const valid = await bcrypt.compare(input.password, citizen.passwordHash);
    if (valid) {
      const tokens = await createTokensForCitizen(citizen.id);
      return {
        ...tokens,
        user: {
          nombre: citizen.nombre ?? undefined,
          apellidos: citizen.apellidos ?? undefined,
          email: citizen.email ?? undefined,
        },
      };
    }
  }

  const user = input.email
    ? await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } })
    : await prisma.user.findUnique({ where: { phone: input.phone! }, include: { role: true } });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Credenciales inválidas');
  }
  const tokens = await createTokens(user.id, user.role.name);
  return {
    ...tokens,
    user: { email: user.email ?? undefined },
  };
}

export async function forgotPassword(input: { email?: string; phone?: string }) {
  if (!input.email && !input.phone) {
    throw new Error('Se requiere email o teléfono');
  }
  // Por seguridad no revelamos si la cuenta existe. Siempre devolvemos éxito.
  // Aquí se puede: buscar Citizen/User, generar token de reset, enviar correo/SMS.
  return { ok: true };
}

async function createTokens(userId: string, roleName: string) {
  const accessToken = jwt.sign(
    { sub: userId, role: roleName, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiresIn }
  );
  const refreshTokenValue = randomBytes(32).toString('hex');
  const decoded = jwt.decode(accessToken) as { exp?: number };
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, token: refreshTokenValue, expiresAt: refreshExpires },
  });
  const refreshToken = jwt.sign(
    { sub: userId, jti: refreshTokenValue, type: 'refresh', kind: 'user' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
  return {
    accessToken,
    refreshToken,
    expiresIn: decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900,
  };
}

async function createTokensForCitizen(citizenId: string) {
  const accessToken = jwt.sign(
    { sub: citizenId, role: 'citizen', type: 'access' },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiresIn }
  );
  const refreshTokenValue = randomBytes(32).toString('hex');
  const decoded = jwt.decode(accessToken) as { exp?: number };
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.citizenRefreshToken.create({
    data: { citizenId, token: refreshTokenValue, expiresAt: refreshExpires },
  });
  const refreshToken = jwt.sign(
    { sub: citizenId, jti: refreshTokenValue, type: 'refresh', kind: 'citizen' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
  return {
    accessToken,
    refreshToken,
    expiresIn: decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900,
  };
}

export async function refresh(refreshTokenFromBody: string) {
  const decoded = jwt.verify(refreshTokenFromBody, config.jwtSecret) as {
    sub?: string;
    jti?: string;
    type?: string;
    kind?: string;
  };
  if (decoded.type !== 'refresh' || !decoded.jti || !decoded.sub) {
    throw new Error('Token de refresco inválido');
  }
  if (decoded.kind === 'citizen') {
    const stored = await prisma.citizenRefreshToken.findFirst({
      where: { token: decoded.jti, citizenId: decoded.sub },
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.citizenRefreshToken.delete({ where: { id: stored.id } }).catch(() => {});
      throw new Error('Token de refresco expirado o revocado');
    }
    await prisma.citizenRefreshToken.delete({ where: { id: stored.id } });
    return createTokensForCitizen(stored.citizenId);
  }
  const stored = await prisma.refreshToken.findFirst({
    where: { token: decoded.jti, userId: decoded.sub },
    include: { user: { include: { role: true } } },
  });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    throw new Error('Token de refresco expirado o revocado');
  }
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return createTokens(stored.userId, stored.user.role.name);
}

export async function verifyAccessToken(token: string): Promise<{ userId: string; role: string }> {
  const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string; role?: string; type?: string };
  if (decoded.type !== 'access' || !decoded.sub) {
    throw new Error('Token inválido');
  }
  return { userId: decoded.sub, role: decoded.role ?? 'citizen' };
}
