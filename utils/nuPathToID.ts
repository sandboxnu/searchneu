const nupathToId = (nupath: string): string => {
  switch (nupath) {
    case 'Natural/Designed World':
      return 'ND';
    case 'Creative Express/Innov':
      return 'EI';
    case 'Interpreting Culture':
      return 'IC';
    case 'Formal/Quant Reasoning':
      return 'FQ';
    case 'Societies/Institutions':
      return 'SI';
    case 'Analyzing/Using Data':
      return 'AD';
    case 'Difference/Diversity':
      return 'DD';
    case 'Ethical Reasoning':
      return 'ER';
    case '1st Yr Writing':
      return 'WF';
    case 'Writing Intensive':
      return 'WI';
    case 'Adv Writ Dscpl':
      return 'WD';
    case 'Integration Experience':
      return 'EX';
    case 'Capstone Experience':
      return 'EX';
    default:
      return nupath;
  }
};

export default nupathToId;
