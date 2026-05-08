interface BadgeProps {
    value: number | string
    suffix?: string
    size?: 'sm' | 'md'
}

export default function Badge({ value, suffix = '%', size = 'sm' }: BadgeProps) {
    const num = typeof value === 'string' ? parseFloat(value) : value
    const isPos = num >= 0
    const label = typeof value === 'number'
        ? `${isPos ? '+' : ''}${num.toFixed(2)}${suffix}`
        : value

    return (
        <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: size === 'sm' ? '11px' : '13px',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            background: isPos ? 'rgba(0,212,160,0.1)' : 'rgba(255,77,106,0.1)',
            color: isPos ? 'var(--green)' : 'var(--red)',
            display: 'inline-block',
        }}>
            {label}
        </span>
    )
}