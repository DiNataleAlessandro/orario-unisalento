import { describe, it, expect } from 'vitest';
import { parseDocenteEmail, getProfessorsData, cleanHtmlTags, formatSubjectName, toTitleCase, isAnnullata } from './transformers';

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
    it('should handle comma separated professors and emails and apply Title Case', () => {
      const names = 'MARIO ROSSI, maria bianchi';
      const emails = 'mario.rossi@unisalento.it, maria.bianchi@unisalento.it';
      const result = getProfessorsData(names, emails);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ nome: 'Mario Rossi', email: 'mario.rossi@unisalento.it' });
      expect(result[1]).toEqual({ nome: 'Maria Bianchi', email: 'maria.bianchi@unisalento.it' });
    });

    it('should generate emails if missing and apply Title Case', () => {
      const names = 'mario rossi';
      const emails = '';
      const result = getProfessorsData(names, emails);
      
      expect(result[0].nome).toBe('Mario Rossi');
      expect(result[0].email).toBe('mario.rossi@unisalento.it');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to Title Case', () => {
      expect(toTitleCase('MARIO ROSSI')).toBe('Mario Rossi');
      expect(toTitleCase('mario rossi')).toBe('Mario Rossi');
    });

    it('should handle hyphens and apostrophes', () => {
      expect(toTitleCase('D-AGOSTINO')).toBe('D-Agostino');
      expect(toTitleCase("DELL'ANNA")).toBe("Dell'Anna");
    });
  });

  describe('formatSubjectName', () => {
    it('should convert to UPPERCASE', () => {
      expect(formatSubjectName('Analisi Matematica')).toBe('ANALISI MATEMATICA');
    });

    it('should clean HTML and convert to UPPERCASE', () => {
      expect(formatSubjectName('<b>Analisi</b> Matematica')).toBe('ANALISI MATEMATICA');
    });

    it('should trim and handle multiple spaces', () => {
      expect(formatSubjectName('  Analisi    Matematica  ')).toBe('ANALISI MATEMATICA');
    });
  });

  describe('isAnnullata', () => {
    it('should return true if annullata flag is "1"', () => {
      expect(isAnnullata({ annullata: '1' })).toBe(true);
    });

    it('should return true if is_annullata flag is "1"', () => {
      expect(isAnnullata({ is_annullata: '1' })).toBe(true);
    });

    it('should return true if Annullato flag is "1"', () => {
      expect(isAnnullata({ Annullato: '1' })).toBe(true);
    });

    it('should return true if stato is "annullata"', () => {
      expect(isAnnullata({ stato: 'annullata' })).toBe(true);
      expect(isAnnullata({ stato: 'ANNULLATA' })).toBe(true);
    });

    it('should return true if name contains (annullata)', () => {
      expect(isAnnullata({ nome_insegnamento: 'Analisi (annullata)' })).toBe(true);
      expect(isAnnullata({ nome_insegnamento: 'Analisi (ANNULLATO)' })).toBe(true);
    });

    it('should return false if not annullata', () => {
      expect(isAnnullata({ nome_insegnamento: 'Analisi' })).toBe(false);
      expect(isAnnullata({ stato: 'attiva' })).toBe(false);
    });
  });
});
