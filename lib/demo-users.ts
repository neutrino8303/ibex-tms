/** Seeded demo accounts — password for all: password123 */
export const DEMO_PASSWORD = "password123";

export type DemoUser = {
  email: string;
  name: string;
  role: string;
};

export const demoUsers: DemoUser[] = [
  { email: "admin@tms.local", name: "Ana Ferreira", role: "Admin" },
  {
    email: "training.manager@tms.local",
    name: "Ricardo Mendes",
    role: "Training manager",
  },
  { email: "examiner.silva@tms.local", name: "João Silva", role: "Examiner" },
  { email: "examiner.costa@tms.local", name: "Maria Costa", role: "Examiner" },
  { email: "pilot.almeida@tms.local", name: "Pedro Almeida", role: "Pilot" },
  { email: "pilot.santos@tms.local", name: "Inês Santos", role: "Pilot" },
];
