import Icon from './Icon';

const DOTS = {
  calorias: 'marker',
  proteinas: 'status',
  carbohidratos: 'marker-red',
};

export default function Nutrient({ label, value, kind }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[14px] border border-[#dde6df] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <Icon name={DOTS[kind]} size={9} />
        <p className="whitespace-nowrap text-xl text-[#17352c]">{value}</p>
      </div>
      <p className="text-xs text-[#687b73]">{label}</p>
    </div>
  );
}
