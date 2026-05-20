import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('<App />', () => {
  it('renderiza la marca GaliciaWear y el aviso de Fase 0', () => {
    render(<App />);
    expect(screen.getByText('GaliciaWear')).toBeInTheDocument();
    expect(screen.getByText(/Fase 0/)).toBeInTheDocument();
  });
});
