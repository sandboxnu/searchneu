import { Campus } from '../components/types';
import colors from '../styles/_exports.module.scss';

export const campusToColor: Record<Campus, string> = {
  [Campus.NEU]: colors.neu_red,
  [Campus.CPS]: colors.cps_yellow,
  [Campus.LAW]: colors.law_blue,
};
