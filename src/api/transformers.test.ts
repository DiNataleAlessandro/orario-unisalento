import { describe, it, expect } from 'vitest';
import { parseDocenteEmail, getProfessorsData, cleanHtmlTags } from './transformers';

describe('transformers', () => {
  describe('parseDocenteEmail', () => {
    it('should parse simple names correctly', () => {
      expect(parseDocenteEmail('Mario Rossi')).toBe('mario.rossi@unisalento.it');
    });

    it('should handle academic titles', () => {
      expect(parseDocenteEmail('Prof.ssa Maria Bianchi')).toBe('maria.bianchi@unisalento.it');
      expect(parseDocenteEmail('Dott. Giuseppe Verdi')).toBe('giuseppe.verdi@unisalento.it');
    });

    it('should handle multiple names by joining names and appending surname', () => {
      expect(parseDocenteEmail('Anna Maria Esposito')).toBe('annamaria.esposito@unisalento.it');
    });

    it('should clean HTML tags', () => {
      expect(parseDocenteEmail('<b>Mario</b> Rossi')).toBe('mario.rossi@unisalento.it');
    });

    it('should handle empty input', () => {
      expect(parseDocenteEmail('')).toBe('');
    });
  });

  describe('cleanHtmlTags', () => {
    it('should remove HTML tags', () => {
      expect(cleanHtmlTags('<b>Materia</b> <i>Extra</i>')).toBe('Materia Extra');
    });

    it('should trim whitespace', () => {
      expect(cleanHtmlTags('  Test  ')).toBe('Test');
    });
  });

  describe('getProfessorsData', () => {
    it('should handle comma separated professors and emails', () => {
      const names = 'Mario Rossi, Maria Bianchi';
      const emails = 'mario.rossi@unisalento.it, maria.bianchi@unisalento.it';
      const result = getProfessorsData(names, emails);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ nome: 'Mario Rossi', email: 'mario.rossi@unisalento.it' });
      expect(result[1]).toEqual({ nome: 'Maria Bianchi', email: 'maria.bianchi@unisalento.it' });
    });

    it('should generate emails if missing', () => {
      const names = 'Mario Rossi';
      const emails = '';
      const result = getProfessorsData(names, emails);
      
      expect(result[0].email).toBe('mario.rossi@unisalento.it');
    });
  });
});
