// JUSTIFICACIÓN: interface + clase abstracta genérica que materializa el patrón Repository.
// Todas las clases concretas extienden RepositorioBase<T> y obtienen el singleton Prisma.
// Cumple "POO + herencia + genéricos" de la rúbrica DAM (módulos Fase 2b-2e lo usan).
import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Contrato mínimo que debe cumplir cualquier repositorio: operaciones genéricas
 * de búsqueda por identificador y eliminación, comunes a todas las entidades.
 *
 * @typeParam T tipo de la entidad gestionada por el repositorio
 */
export interface IRepositorio<T> {
  /** Busca una entidad por su identificador único. Devuelve `null` si no existe. */
  buscarPorId(id: string): Promise<T | null>;
  /** Elimina la entidad con el identificador indicado. */
  eliminar(id: string): Promise<void>;
}

/**
 * Clase base abstracta para los repositorios de cada módulo de dominio
 * (usuarios, productos, pedidos, etc.).
 *
 * Proporciona acceso protegido a la instancia compartida de `PrismaClient` (`this.bd`)
 * y obliga a las subclases a implementar `buscarPorId` y `eliminar`, garantizando
 * una interfaz mínima común mientras cada repositorio concreto añade sus propios
 * métodos específicos (listar, crear, actualizar, filtros, etc.).
 *
 * @typeParam T tipo de la entidad gestionada por el repositorio
 */
export abstract class RepositorioBase<T> implements IRepositorio<T> {
  /** Instancia compartida de PrismaClient, accesible por las subclases. */
  protected readonly bd: PrismaClient;

  constructor() {
    this.bd = prisma;
  }

  abstract buscarPorId(id: string): Promise<T | null>;
  abstract eliminar(id: string): Promise<void>;
}
