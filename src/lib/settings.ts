export type Settings = {
  sound: boolean;
  // Type the numbers on a number pad instead of placing tiles.
  expert: boolean;
};

export const initialSettings: Settings = {
  sound: true,
  expert: false,
};
