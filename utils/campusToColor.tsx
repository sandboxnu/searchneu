import { Campus } from '../components/types';
import Colors from '../styles/_exports.module.scss';

export const campusToColor: Record<Campus, string> = {
  [Campus.NEU]: Colors.neu_red,
  [Campus.CPS]: Colors.cps_yellow,
  [Campus.LAW]: Colors.law_blue,
};
