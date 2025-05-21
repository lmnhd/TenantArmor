export interface Issue {
  id: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  recommendation: string;
}

export interface Clause {
  id: string;
  title: string;
  text: string;
  issues: Issue[];
}

export interface LeaseAnalysis {
  id: string;
  documentName: string;
  uploadDate: string;
  summary: string;
  clauses: Clause[];
  overallSeverity: 'High' | 'Medium' | 'Low';
} 