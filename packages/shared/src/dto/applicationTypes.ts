// packages/shared/src/dto/applicationTypes.ts

export interface ApplyApplicationInput {
  experience?: string | null;
  salaryExpectation?: string | null;
  noticePeriod?: string | null;
  location?: string | null;
  expertise?: string[] | null;
  coverLetter?: string | null;
}
