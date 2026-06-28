import { useState, useEffect, useMemo } from 'react';
import { getAnalytics } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Loader2,
  Award,
  Sparkles,
  Building2,
  Calendar,
  TrendingUp,
  Layers,
  Hash,
} from 'lucide-react';

// ─── Palette ──────────────────────────────────────────────
const COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#6366f1', '#a855f7', '#14b8a6',
];

// ─── Animated counter hook ────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null || target === 0) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(start);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

// ─── Framer variants ─────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 80, damping: 18 },
  },
};
const statVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.3 + i * 0.12, type: 'spring', stiffness: 90 },
  }),
};

// ─── Custom tooltip shared style ──────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(10,10,14,0.95)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '14px 18px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
};

// ─── Custom bar shape with gradient ───────────────────────
const GradientBar = (props) => {
  const { x, y, width, height, index } = props;
  const id = `barGrad-${index}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect
        x={x} y={y} width={width} height={height}
        rx={10} ry={10}
        fill={`url(#${id})`}
        style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.3))' }}
      />
    </g>
  );
};

// ─── Custom Y-axis tick for Studio chart ──────────────────
const StudioTick = ({ x, y, payload, studioCounts }) => {
  const idx = payload.index;
  const count = studioCounts?.[payload.value] ?? '';
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8} y={0} dy={4}
        textAnchor="end"
        fill="rgba(255,255,255,0.7)"
        fontSize={10}
        fontWeight={800}
      >
        {payload.value}
      </text>
      <text
        x={-8} y={14}
        textAnchor="end"
        fill="rgba(255,255,255,0.3)"
        fontSize={8}
        fontWeight={600}
      >
        {count} works
      </text>
      {/* rank badge */}
      <circle cx={-175} cy={4} r={10} fill="rgba(139,92,246,0.15)" />
      <text
        x={-175} y={4} dy={4}
        textAnchor="middle"
        fill="#8b5cf6"
        fontSize={9}
        fontWeight={900}
      >
        #{idx + 1}
      </text>
    </g>
  );
};

// ─── Historical tooltip with color dots ───────────────────
const TrendTooltip = ({ active, payload, label, genres }) => {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => !p.dataKey?.includes('_count'));
  return (
    <div style={tooltipStyle}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </p>
      {items.map((entry) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block', boxShadow: `0 0 6px ${entry.color}` }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, flex: 1 }}>{entry.dataKey}</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>{Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredGenre, setHoveredGenre] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await getAnalytics();
        if (response.success) setData(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // ─── Derived stats ───────────────────────────────────────
  const totalAnime = useMemo(
    () => data?.genrePopularity?.reduce((s, g) => s + (g.count || 0), 0) ?? 0,
    [data],
  );
  const totalStudios = useMemo(() => data?.studioQuality?.length ?? 0, [data]);
  const totalYears = useMemo(() => data?.historicalTrends?.length ?? 0, [data]);

  const animatedAnime = useCountUp(totalAnime);
  const animatedStudios = useCountUp(totalStudios);
  const animatedYears = useCountUp(totalYears);

  const topGenres = useMemo(
    () => data?.genrePopularity?.slice(0, 5).map((g) => g.genre) || [],
    [data],
  );

  const studioCounts = useMemo(() => {
    const map = {};
    data?.studioQuality?.forEach((s) => { map[s.studio] = s.count; });
    return map;
  }, [data]);

  // ─── Treemap data ────────────────────────────────────────
  const treemapData = useMemo(() => {
    if (!data?.genrePopularity) return [];
    const total = data.genrePopularity.reduce((s, g) => s + g.count, 0);
    return data.genrePopularity.map((g, i) => ({
      ...g,
      pct: ((g.count / total) * 100).toFixed(1),
      color: COLORS[i % COLORS.length],
    }));
  }, [data]);

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-satori-accent" size={64} />
          <div className="absolute inset-0 bg-satori-accent/20 blur-2xl rounded-full" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-white/40 animate-pulse">
          Running Neural Aggregations...
        </p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-8 bg-[#050507]">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══════════ HERO HEADER ═══════════ */}
        <motion.header
          variants={cardVariants}
          className="mb-16 border-b border-white/[0.05] pb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-satori-accent/20 rounded-xl">
                  <BarChart3 className="text-satori-accent" size={28} />
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                  Neural{' '}
                  <span className="bg-gradient-to-r from-satori-accent to-blue-500 bg-clip-text text-transparent">
                    Insights
                  </span>
                </h1>
              </div>
              <p className="text-satori-muted text-lg max-w-2xl font-medium leading-relaxed">
                Macro-level intelligence derived from top-tier anime across{' '}
                <span className="text-white font-semibold">{totalStudios}</span> elite studios and{' '}
                <span className="text-white font-semibold">{totalYears}</span> years of history.
              </p>
            </div>

            {/* Stat counters */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Anime Indexed', value: animatedAnime.toLocaleString(), icon: Layers, accent: false },
                { label: 'Studios', value: animatedStudios, icon: Building2, accent: false },
                { label: 'Years of Data', value: animatedYears, icon: Calendar, accent: true },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={statVariants}
                  className={`${
                    stat.accent
                      ? 'bg-satori-accent/5 border-satori-accent/20'
                      : 'bg-white/[0.03] border-white/10'
                  } border rounded-[1.5rem] p-6 min-w-[140px] backdrop-blur-xl shadow-2xl relative overflow-hidden group`}
                >
                  <div className={`absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.accent ? 'text-satori-accent' : 'text-white'}`}>
                    <stat.icon size={72} />
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${stat.accent ? 'text-satori-accent/50' : 'text-white/30'}`}>
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-black tabular-nums ${stat.accent ? 'text-satori-accent' : 'text-white'}`}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ═══════════ STUDIO QUALITY LEADERS ═══════════ */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative bg icon */}
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Building2 size={140} />
            </div>

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <Award size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase text-white">
                    Studio Quality Leaders
                  </h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">
                    Ranked by average score · min 10 works
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[520px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.studioQuality}
                  layout="vertical"
                  margin={{ left: 60, right: 20, top: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studioBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6d28d9" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" domain={[7, 9.5]} hide />
                  <YAxis
                    dataKey="studio"
                    type="category"
                    width={180}
                    axisLine={false}
                    tickLine={false}
                    tick={<StudioTick studioCounts={studioCounts} />}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(139,92,246,0.04)' }}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value, name) => {
                      if (name === 'avgScore') return [`${Number(value).toFixed(2)} / 10`, 'Avg Score'];
                      return [value, name];
                    }}
                  />
                  <Bar
                    dataKey="avgScore"
                    fill="url(#studioBarGradient)"
                    radius={[0, 12, 12, 0]}
                    barSize={22}
                    shape={<GradientBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ═══════════ GENRE QUALITY RADAR ═══════════ */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-4 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-satori-accent/[0.03] to-transparent pointer-events-none" />

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="p-2 bg-satori-accent/10 rounded-lg text-satori-accent">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase text-white">
                  Genre Quality
                </h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">
                  Radar spectrum
                </p>
              </div>
            </div>

            <div className="h-[500px] flex items-center justify-center relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={120} data={data?.genreQuality}>
                  <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </radialGradient>
                  </defs>
                  <PolarGrid
                    stroke="rgba(255,255,255,0.06)"
                    radialLines={false}
                  />
                  <PolarAngleAxis
                    dataKey="genre"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={9}
                    fontWeight="bold"
                    tickLine={false}
                  />
                  {/* Filled layer at 20% opacity */}
                  <Radar
                    name="Quality Fill"
                    dataKey="avgScore"
                    stroke="none"
                    fill="#8b5cf6"
                    fillOpacity={0.15}
                  />
                  {/* Line-only layer with glow */}
                  <Radar
                    name="Avg Score"
                    dataKey="avgScore"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    fill="none"
                    fillOpacity={0}
                    dot={{
                      r: 4,
                      fill: '#8b5cf6',
                      stroke: '#050507',
                      strokeWidth: 2,
                    }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${Number(value).toFixed(2)} / 10`, 'Avg Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ═══════════ GENRE POPULARITY TREEMAP ═══════════ */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-12 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Layers size={140} />
            </div>

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Hash size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase text-white">
                    Genre Popularity
                  </h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">
                    Distribution by anime count · hover for details
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {treemapData.map((g) => (
                <motion.div
                  key={g.genre}
                  className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                  style={{
                    flexBasis: `calc(${Math.max(parseFloat(g.pct), 6)}% - 8px)`,
                    flexGrow: 1,
                    minWidth: '100px',
                    height: `${Math.max(70, parseFloat(g.pct) * 4 + 60)}px`,
                    background: `linear-gradient(135deg, ${g.color}18, ${g.color}08)`,
                    border: hoveredGenre === g.genre ? `1px solid ${g.color}80` : `1px solid ${g.color}20`,
                    boxShadow: hoveredGenre === g.genre ? `0 0 30px ${g.color}20, inset 0 0 30px ${g.color}08` : 'none',
                  }}
                  onMouseEnter={() => setHoveredGenre(g.genre)}
                  onMouseLeave={() => setHoveredGenre(null)}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                    <span
                      className="font-black text-xs uppercase tracking-wider mb-1"
                      style={{ color: g.color }}
                    >
                      {g.genre}
                    </span>
                    <span className="text-white/60 text-[10px] font-bold">
                      {g.count} anime
                    </span>
                    {hoveredGenre === g.genre && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white/80 text-[10px] font-bold mt-1"
                      >
                        Avg: {Number(g.avgScore).toFixed(2)} / 10
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══════════ HISTORICAL TRENDS ═══════════ */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-12 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <TrendingUp size={140} />
            </div>

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase text-white">
                    Yearly Genre Evolution
                  </h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">
                    Year-by-year average scores · top 5 dominant genres
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                {topGenres.map((g, i) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: COLORS[i % COLORS.length],
                        boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}60`,
                      }}
                    />
                    <span className="text-[10px] font-bold text-white/50 uppercase">
                      {g}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.historicalTrends}>
                  <defs>
                    {topGenres.map((genre, idx) => (
                      <linearGradient
                        key={`areaGrad-${genre}`}
                        id={`areaGrad-${genre}`}
                        x1="0" y1="0" x2="0" y2="1"
                      >
                        <stop offset="0%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                    {topGenres.map((genre, idx) => (
                      <linearGradient
                        key={`lineGrad-${genre}`}
                        id={`lineGrad-${genre}`}
                        x1="0" y1="0" x2="1" y2="0"
                      >
                        <stop offset="0%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.6} />
                        <stop offset="50%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    fontWeight={900}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[6, 9]}
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    fontWeight={900}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TrendTooltip genres={topGenres} />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                    }}
                  />
                  {topGenres.map((genre, idx) => (
                    <Area
                      key={`area-${genre}`}
                      type="monotone"
                      dataKey={genre}
                      stroke="none"
                      fill={`url(#areaGrad-${genre})`}
                      fillOpacity={1}
                      legendType="none"
                    />
                  ))}
                  {topGenres.map((genre, idx) => (
                    <Line
                      key={genre}
                      type="monotone"
                      dataKey={genre}
                      stroke={`url(#lineGrad-${genre})`}
                      strokeWidth={3}
                      dot={{
                        r: 3,
                        strokeWidth: 2,
                        fill: '#050507',
                        stroke: COLORS[idx % COLORS.length],
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 0,
                        fill: COLORS[idx % COLORS.length],
                        style: { filter: `drop-shadow(0 0 8px ${COLORS[idx % COLORS.length]})` },
                      }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Footer accent line */}
        <div className="mt-16 h-px bg-gradient-to-r from-transparent via-satori-accent/20 to-transparent" />
      </motion.div>
    </div>
  );
};

export default Analytics;
