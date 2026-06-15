// Revela su contenido al entrar en el viewport (scroll reveal). Una sola vez, sutil, y
// neutralizado si el usuario prefiere menos movimiento.
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usarMovimientoReducido } from '@/hooks/usarMovimientoReducido';

interface PropsRevelar {
  children: ReactNode;
  retraso?: number;
  className?: string;
}

/** Anima la aparición de su contenido al entrar en pantalla (una sola vez); respeta reduced-motion. */
export function Revelar({ children, retraso = 0, className }: PropsRevelar) {
  const reducido = usarMovimientoReducido();
  return (
    <motion.div
      className={className}
      initial={reducido ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: retraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
