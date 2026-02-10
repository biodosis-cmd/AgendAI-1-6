import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WeeklyChart = ({ data }) => {
    // data expected: [{ name: 'Lun', planned: 4, pending: 2 }, ...]

    return (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-sm backdrop-blur-sm h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-200">Actividad Semanal</h3>
                <p className="text-xs text-slate-500">Clases planificadas vs pendientes</p>
            </div>

            <div className="flex-grow min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barSize={12}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#1e293b', opacity: 0.4 }}
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                padding: '8px 12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="planned" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-planned-${index}`} fill="#6366f1" />
                            ))}
                        </Bar>
                        <Bar dataKey="pending" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} opacity={0.5} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WeeklyChart;
