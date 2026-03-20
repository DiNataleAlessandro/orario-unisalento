export interface Lezione {
  id: string;
  nome_insegnamento: string;
  docente: string;
  orario: string;
  aula: string;
  nome_giorno: string;
  data: string;
  inizioDateObj?: Date;
  fineDateObj?: Date;
  mail_docente?: string;
  buildingName?: string;
}

export interface ProfessorData {
  nome: string;
  email: string;
}
