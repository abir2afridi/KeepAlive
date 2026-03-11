import React from 'react';
import { motion } from 'framer-motion';

export default function DirectLine() {
  const profileDetails = [
    { label: 'Born', value: '17 Nov 2002' },
    { label: 'Age', value: '22' },
    { label: 'Location', value: 'Gazipur, Dhaka' },
    { label: 'Origin', value: 'Tangail' },
    { label: 'Blood', value: 'B+' },
  ];

  const education = [
    { school: 'Independent University of Bangladesh', degree: 'BSc in Computer Science', years: '2021 - Present' },
    { school: 'Misir Ali Khan Memorial School & College', degree: 'Higher Secondary Certificate', years: '2019 - 2020' },
    { school: 'Professor MEH Arif Secondary School', degree: 'Secondary School Certificate', years: '2017 - 2018' },
  ];

  const skillGroups = [
    { category: 'Languages', items: 'Dart (Flutter), React, Python' },
    { category: 'Mobile', items: 'Android APK, Flutter' },
    { category: 'Web Stack', items: 'React.js, HTML, CSS, JS' },
    { category: 'Systems', items: 'Linux, Terminal, CMake, VM' },
    { category: 'UI/Design', items: 'App UI/UX, Gradients' },
    { category: 'VCS', items: 'Git, GitHub (Private Enabled)' },
  ];

  const insights = [
    { title: 'Personal Traits', content: 'Detail-oriented, curious, and thrives on cross-platform solution experimentation.' },
    { title: 'Development Philosophy', content: 'Clean Flutter structures, step-by-step clarity, and multi-OS native optimization.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-5xl mx-auto space-y-16 transition-all duration-700 pb-12 pt-8"
    >
      <div className="space-y-24">
        {/* 01. Identity Node */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-12 border-b border-line pb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1 bg-primary/40 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Lead Developer</span>
            </div>
            <h2 className="text-5xl font-extralight tracking-tight text-ink lowercase leading-none">Abir Hasan Siam</h2>
            <p className="text-sm text-ink/70 font-medium">Focused on high-performance networking & cross-platform ecosystems.</p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 shrink-0">
            {profileDetails.map((detail, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[9px] font-bold text-ink/40 uppercase tracking-[0.2em]">{detail.label}</p>
                <p className="text-sm font-medium text-ink/90">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 02. Technical Matrix & Education */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-4">
              Skill Matrix <div className="h-px bg-line flex-1" />
            </h3>
            <div className="space-y-8">
              {skillGroups.map((group, idx) => (
                <div key={idx} className="group cursor-default">
                  <p className="text-[8px] font-black text-ink/40 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{group.category}</p>
                  <p className="text-xs font-semibold text-ink leading-relaxed tracking-tight">{group.items}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-4">
              Academic Record <div className="h-px bg-line flex-1" />
            </h3>
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-panel border border-line shadow-sm hover:border-primary/20 transition-colors">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">{edu.years}</p>
                    <h4 className="text-sm font-bold text-ink tracking-tight">{edu.degree}</h4>
                    <p className="text-xs text-ink/60 font-medium">{edu.school}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 03. Core Insights */}
        <div className="p-12 rounded-[3rem] bg-panel border border-line space-y-12">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 text-center">
            System Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {insights.map((insight, idx) => (
              <div key={idx} className="space-y-3 pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <h4 className="text-xs font-black uppercase tracking-widest text-ink">{insight.title}</h4>
                <p className="text-sm text-ink/70 leading-relaxed italic">"{insight.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
