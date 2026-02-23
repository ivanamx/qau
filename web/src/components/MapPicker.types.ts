export type MapPickerProps = {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number) => void;
  className?: string;
};
