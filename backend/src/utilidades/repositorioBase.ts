// JUSTIFICACIÓN: interface + clase abstracta genérica que materializa el patrón Repository.
// Todas las clases concretas extienden RepositorioBase<T> y obtienen el singleton Prisma.
// Cumple "POO + herencia + genéricos" de la rúbrica DAM (módulos Fase 2b-2e lo usan).
import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

export interface IRepositorio<T> {
  buscarPorId(id: string): Promise<T | null>;
  eliminar(id: string): Promise<void>;
}

export abstract class RepositorioBase<T> implements IRepositorio<T> {
  protected readonly bd: PrismaClient;

  constructor() {
    this.bd = prisma;
  }

  abstract buscarPorId(id: string): Promise<T | null>;
  abstract eliminar(id: string): Promise<void>;
}
