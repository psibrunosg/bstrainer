const fs = require('fs');

let w = fs.readFileSync('src/sections/Workout.tsx', 'utf8');
w = w.replace(/className=`mb-2 rounded-full p-1.5/g, 'className=`mb-2 rounded-xl p-1.5');
w = w.replace(/className="mt-3 flex items-start gap-2 rounded-full bg-surface p-3"/g, 'className="mt-3 flex items-start gap-2 rounded-xl bg-surface p-3"');
w = w.replace(/<p className="rounded-full border border-line bg-surface px-4 py-3 text-center text-xs text-muted-foreground">/g, '<p className="rounded-xl border border-line bg-surface px-4 py-3 text-center text-xs text-muted-foreground">');
w = w.replace(/className="rounded-full border border-line bg-surface-2 px-3 py-2 text-center font-mono-num text-sm/g, 'className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-center font-mono-num text-sm');
fs.writeFileSync('src/sections/Workout.tsx', w);

let m = fs.readFileSync('src/sections/Measurements.tsx', 'utf8');
m = m.replace(/<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-aqua">/g, '<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-aqua">');
m = m.replace(/className="w-20 rounded-full border border-line bg-background p-2 text-center font-mono-num text-sm/g, 'className="w-20 rounded-xl border border-line bg-background p-2 text-center font-mono-num text-sm');
m = m.replace(/className="h-11 w-full rounded-full border border-line bg-surface px-3 font-mono-num text-sm/g, 'className="h-11 w-full rounded-xl border border-line bg-surface px-3 font-mono-num text-sm');
fs.writeFileSync('src/sections/Measurements.tsx', m);

let s = fs.readFileSync('src/sections/Settings.tsx', 'utf8');
s = s.replace(/<p className="mt-3 rounded-full bg-volt\/10 p-3 text-xs font-medium text-volt">/g, '<p className="mt-3 rounded-xl bg-volt/10 p-3 text-xs font-medium text-volt">');
fs.writeFileSync('src/sections/Settings.tsx', s);

let c = fs.readFileSync('src/sections/Clients.tsx', 'utf8');
c = c.replace(/className="h-12 flex-1 rounded-full border border-line bg-surface px-4 text-sm/g, 'className="h-12 flex-1 rounded-xl border border-line bg-surface px-4 text-sm');
fs.writeFileSync('src/sections/Clients.tsx', c);

console.log('Restored');
