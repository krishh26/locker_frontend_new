export type CpdEntry = {
  id: string;
  user_id: string;
  what_training?: string;
  date?: string;
  how_you_did?: string;
  what_you_learned?: string;
  how_it_improved_work?: string;
};

export type CpdEntryRequest = {
  what_training?: string;
  date?: string;
  how_you_did?: string;
  what_you_learned?: string;
  how_it_improved_work?: string;
};

export type CpdListResponse = {
  status: boolean;
  data?: CpdEntry[];
  message?: string;
  error?: string;
};

export type CpdEntryResponse = {
  status: boolean;
  data?: CpdEntry;
  message?: string;
  error?: string;
};

