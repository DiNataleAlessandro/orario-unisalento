import type { ProfessorData } from '../types/lezione';

export const parseDocenteEmail = (rawName: string): string => {
  if (!rawName) return '';
  
  const cleanName = rawName
    .replace(/<[^>]+>/g, '')
    .replace(/Prof\.ssa|Prof\.|Dott\.ssa|Dott\./gi, '')
    .trim()
    .toLowerCase()
    .replace(/[']/g, '')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
                 
  const parts = cleanName.split(/\s+/);
  
  if (parts.length >= 2) {
    const firstName = parts.pop();
    if (firstName) parts.unshift(firstName);
  }
  
  return `${parts.join('.')}@unisalento.it`;
};

export const getProfessorsData = (rawDocente: string, rawMail: string): ProfessorData[] => {
  if (!rawDocente) return [];
  
  const names = rawDocente.split(',').map(n => n.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const emails = rawMail ? rawMail.split(',').map(m => m.trim()).filter(Boolean) : [];

  return names.map((nome, index) => ({
    nome,
    email: emails[index] || parseDocenteEmail(nome)
  }));
};

export const cleanHtmlTags = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]+>/g, '').trim();
};
