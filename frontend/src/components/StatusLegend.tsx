import { STATUS_COLORS } from '../constants/boss';

export default function StatusLegend() {
  return (
    <div className="status-legend">
      {STATUS_COLORS.map((color) => (
        <div key={color.name} className="legend-item">
          <div 
            className="legend-circle" 
            style={{ backgroundColor: color.value }}
          />
          <span>{color.label}</span>
        </div>
      ))}
    </div>
  );
}
