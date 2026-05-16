import { GradingScale, UserRole } from "@prisma/client";

export type FormTaskDraft = {
  clientId: string;
  id?: string;
  title: string;
  description: string;
  gradingScale: GradingScale;
  isMandatory: boolean;
  order: number;
  qualificationIds: string[];
};

export type FormSectionDraft = {
  clientId: string;
  id?: string;
  title: string;
  order: number;
  tasks: FormTaskDraft[];
};

export type FormDraft = {
  id?: string;
  code: string;
  name: string;
  version: number;
  isPublished: boolean;
  applicableRoles: UserRole[];
  defaultGradingScale: GradingScale;
  sections: FormSectionDraft[];
};

export type QualificationOption = {
  id: string;
  code: string;
  name: string;
};

export function newClientId(): string {
  return `new_${Math.random().toString(36).slice(2, 11)}`;
}

export function createEmptyTask(order: number): FormTaskDraft {
  return {
    clientId: newClientId(),
    title: "",
    description: "",
    gradingScale: GradingScale.PASS_FAIL,
    isMandatory: true,
    order,
    qualificationIds: [],
  };
}

export function createEmptySection(order: number): FormSectionDraft {
  return {
    clientId: newClientId(),
    title: "",
    order,
    tasks: [createEmptyTask(0)],
  };
}

export function createEmptyFormDraft(): FormDraft {
  return {
    code: "",
    name: "",
    version: 1,
    isPublished: false,
    applicableRoles: [UserRole.PILOT],
    defaultGradingScale: GradingScale.PASS_FAIL,
    sections: [createEmptySection(0)],
  };
}

export function reindexSections(sections: FormSectionDraft[]): FormSectionDraft[] {
  return sections.map((section, index) => ({
    ...section,
    order: index,
    tasks: section.tasks.map((task, taskIndex) => ({
      ...task,
      order: taskIndex,
    })),
  }));
}
