export enum RoleType {
  DEVELOPER = 'Developer',
  DESIGNER = 'Designer',
  MANAGER = 'Project Manager',
  QA = 'QA Engineer',
  DATA_SCIENTIST = 'Data Scientist',
  DEVOPS = 'DevOps Engineer'
}

export enum MemberType {
  FULL_TIME = 'Full Time',
  CONTRACTOR = 'Contract (Fieldglass)',
  CONSULTANT = 'Consultant (SOW)'
}

export interface Role {
  id: string;
  title: string;
  defaultHourlyRate: number;
}

export interface TeamMember {
  id: string;
  name: string;
  roleId: string;
  avatarUrl?: string;
  type: MemberType;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'Planning' | 'Active' | 'Completed';
  color: string;
}

export interface Allocation {
  id: string;
  projectId: string;
  memberId: string;
  month: string; // Format: "YYYY-MM"
  percentage: number; // 0 to 100
}

export interface MonthlyMetric {
  month: string;
  revenue: number;
  cost: number;
  margin: number;
}

export interface ForecastData {
  month: string;
  [key: string]: number | string; // Dynamic keys for projects
}