const fs = require('fs');

const fixCSSClasses = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-foreground/g, 'text-ink');
  content = content.replace(/text-muted-foreground/g, 'text-ink');
  content = content.replace(/border-border/g, 'border-line');
  content = content.replace(/bg-card/g, 'bg-panel');
  content = content.replace(/bg-secondary/g, 'bg-panel');
  content = content.replace(/bg-muted/g, 'bg-panel');
  content = content.replace(/bg-accent/g, 'bg-line');
  content = content.replace(/bg-background/g, 'bg-base');
  
  if (file.includes('BenchmarkCharts')) {
    content = content.replace(/const textColor = isDark \? 'rgba\\(255,255,255,0.4\\)' : 'rgba\\(0,0,0,0.6\\)';/g, \"const textColor = 'rgba(255,255,255,0.6)';\");
    content = content.replace(/const gridColor = isDark \? 'rgba\\(255,255,255,0.05\\)' : 'rgba\\(0,0,0,0.1\\)';/g, \"const gridColor = 'rgba(255,255,255,0.05)';\");
    content = content.replace(/const bgFill = isDark \? 'rgba\\(255,255,255,0.02\\)' : 'rgba\\(0,0,0,0.04\\)';/g, \"const bgFill = 'rgba(255,255,255,0.02)';\");
  }
  
  fs.writeFileSync(file, content, 'utf8');
};

fixCSSClasses('src/components/DnsLeaderboard.tsx');
fixCSSClasses('src/components/BenchmarkCharts.tsx');
console.log('Fixed');
