import { useEffect, useState } from 'react'

interface SkillCardProps {
  skill: {
    name: string
    level: number
    category: string
    icon: string
  }
  index: number
  activeFilter: string
}

export default function SkillCard({ skill, index, activeFilter }: SkillCardProps) {
  const [animatedLevel, setAnimatedLevel] = useState(0)

  useEffect(() => {
    // Reset to 0 first
    setAnimatedLevel(0)

    // Then animate to target level
    const timer = setTimeout(
      () => {
        setAnimatedLevel(skill.level)
      },
      index * 50 + 100,
    )

    return () => clearTimeout(timer)
  }, [skill.level, index, activeFilter])

  return (
    <div
      className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group hover:-translate-y-2 skill-card"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
            {skill.icon}
          </span>
          <span className="font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-300">
            {skill.name}
          </span>
        </div>
        <span className="text-sm font-bold text-purple-400 tabular-nums">{animatedLevel}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${animatedLevel}%` }}
        >
          <div
            className="absolute inset-0 bg-white/20 animate-shimmer"
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>
      {/* Category Badge */}
      <div className="mt-3">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-105 ${
            skill.category === 'AI Tools'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : skill.category === 'Development'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : skill.category === 'Security'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
          }`}
        >
          {skill.category}
        </span>
      </div>
    </div>
  )
}
