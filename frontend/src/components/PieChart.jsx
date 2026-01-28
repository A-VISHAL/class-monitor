import React from 'react'

export default function PieChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <div className="small">No data available</div>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0

  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e']

  return (
    <div style={{ textAlign: 'center' }}>
      <h4>{title}</h4>
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          
          // Calculate path for pie slice
          const startAngleRad = (startAngle * Math.PI) / 180
          const endAngleRad = (endAngle * Math.PI) / 180
          
          const x1 = 100 + 80 * Math.cos(startAngleRad)
          const y1 = 100 + 80 * Math.sin(startAngleRad)
          const x2 = 100 + 80 * Math.cos(endAngleRad)
          const y2 = 100 + 80 * Math.sin(endAngleRad)
          
          const largeArcFlag = angle > 180 ? 1 : 0
          
          const pathData = [
            `M 100 100`,
            `L ${x1} ${y1}`,
            `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ')
          
          currentAngle += angle
          
          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth="2"
            />
          )
        })}
      </svg>
      
      <div style={{ marginTop: 16 }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <div 
              style={{ 
                width: 12, 
                height: 12, 
                backgroundColor: colors[index % colors.length],
                borderRadius: 2
              }} 
            />
            <span className="small">{item.label}: {item.value}% ({Math.round((item.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}