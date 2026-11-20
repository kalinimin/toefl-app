// Типы заданий и общая «шапка» JSON-файла задания.
// Спецификация: документ «TOEFL-тренажёр: спецификация заданий и шаблоны».

export type Section = 'reading' | 'listening' | 'writing' | 'speaking';

export type TaskType =
  | 'complete_the_words'
  | 'daily_life'
  | 'academic_passage'
  | 'choose_response'
  | 'conversation'
  | 'announcement'
  | 'academic_talk'
  | 'build_sentence'
  | 'write_email'
  | 'academic_discussion'
  | 'listen_repeat'
  | 'interview';

export type Cefr = 'A2' | 'B1' | 'B2' | 'C1';

export interface TaskFile {
  id: string;
  type: TaskType;
  section: Section;
  cefr: Cefr;
  topic?: string;
  source?: 'original' | 'ets_sample' | 'generated';
  status?: 'draft' | 'approved';
  version: number;
  time_limit_sec?: number | null;
  content: Record<string, unknown>;
}

export interface IndexEntry {
  id: string;
  path: string;
  version: number;
  cefr?: Cefr;
}

export interface ContentIndex {
  updated: string;
  tasks: IndexEntry[];
}

export const SECTIONS: { id: Section; title: string; subtitle: string }[] = [
  { id: 'reading', title: 'Reading', subtitle: 'Чтение' },
  { id: 'listening', title: 'Listening', subtitle: 'Аудирование' },
  { id: 'writing', title: 'Writing', subtitle: 'Письмо' },
  { id: 'speaking', title: 'Speaking', subtitle: 'Говорение' },
];

export const TASK_TYPES: Record<
  TaskType,
  { section: Section; title: string; ready: boolean; plannedWeek: number }
> = {
  complete_the_words: { section: 'reading', title: 'Complete the Words', ready: false, plannedWeek: 2 },
  daily_life: { section: 'reading', title: 'Read in Daily Life', ready: false, plannedWeek: 6 },
  academic_passage: { section: 'reading', title: 'Read an Academic Passage', ready: false, plannedWeek: 6 },
  choose_response: { section: 'listening', title: 'Listen and Choose a Response', ready: false, plannedWeek: 6 },
  conversation: { section: 'listening', title: 'Listen to a Conversation', ready: false, plannedWeek: 6 },
  announcement: { section: 'listening', title: 'Listen to an Announcement', ready: false, plannedWeek: 6 },
  academic_talk: { section: 'listening', title: 'Listen to an Academic Talk', ready: false, plannedWeek: 6 },
  build_sentence: { section: 'writing', title: 'Build a Sentence', ready: false, plannedWeek: 2 },
  write_email: { section: 'writing', title: 'Write an Email', ready: false, plannedWeek: 4 },
  academic_discussion: { section: 'writing', title: 'Write for an Academic Discussion', ready: false, plannedWeek: 4 },
  listen_repeat: { section: 'speaking', title: 'Listen and Repeat', ready: false, plannedWeek: 3 },
  interview: { section: 'speaking', title: 'Take an Interview', ready: false, plannedWeek: 5 },
};

export function isTaskType(value: unknown): value is TaskType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TASK_TYPES, value);
}
