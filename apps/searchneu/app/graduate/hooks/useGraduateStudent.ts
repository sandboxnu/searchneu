import useSWR from 'swr';
import { GraduateAPI } from '../graduateApiClient';
import { GetStudentResponse } from '../common/api-response-types';

export function useGraduateStudent() {
  const { data, error, mutate } = useSWR<GetStudentResponse | null>(
    '/graduate/student',
    async () => {
      try {
        const student = await GraduateAPI.student.getMeWithPlan();
        return student;
      } catch (err) {
        console.error('Failed to fetch graduate student:', err);
        return null;
      }
    }
  );

  return {
    student: data,
    error,
    mutateStudent: mutate,
    isLoading: !data && !error,
  };
}