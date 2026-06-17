/** Toggle trainer map; when enabling, auto-set learner map (Option A: off keeps learner map). */
export function applyTrainerMapToggle(item: {
  learnerMap?: boolean;
  trainerMap?: boolean;
  signed_off?: boolean;
}): boolean {
  const nextTrainerMap = !(item.trainerMap ?? false);
  item.trainerMap = nextTrainerMap;
  if (nextTrainerMap) {
    item.learnerMap = true;
  } else {
    item.signed_off = false;
  }
  return nextTrainerMap;
}
