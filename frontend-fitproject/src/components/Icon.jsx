export default function Icon({ name, size = 20, alt = '' }) {
  return <img src={`/icons/${name}.svg`} alt={alt} width={size} height={size} />;
}
