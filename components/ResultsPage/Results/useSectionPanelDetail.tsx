interface UseSectionPanelDetailReturn {
  getSeatsClass: () => string;
}

export default function useSectionPanelDetail(
  seatsRemaining: number,
  seatsCapacity: number
): UseSectionPanelDetailReturn {
  const getSeatsClass = (): string => {
    const seatingPercentage = seatsRemaining / seatsCapacity;
    if (seatingPercentage > 2 / 3) {
      return 'green';
    }
    if (seatingPercentage > 1 / 3) {
      return 'yellow';
    }
    return 'red';
  };

  return {
    getSeatsClass: getSeatsClass,
  };
}
