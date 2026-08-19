const fs = require('fs');
const updates = {
  'Clients.tsx': ['Workspace profissional', 'Painel de alunos'],
  'Measurements.tsx': ['Evolução', 'Medidas & avaliação'],
  'Library.tsx': ['Catálogo', 'Biblioteca de exercícios'],
  'Personal.tsx': ['Acompanhamento', 'Seu personal'],
  'Plans.tsx': ['Mesociclos', 'Planos de treino'],
  'Progress.tsx': ['Estatísticas', 'Progresso'],
  'Settings.tsx': ['Preferências', 'Ajustes'],
  'Workout.tsx': ['Check-in diário', 'Como você chegou hoje?'],
  'Messages.tsx': ['Comunicação', 'Mensagens'],
  'Onboarding.tsx': ['Perfil de treino', 'Conta pra gente sobre você']
};

for (const [file, [sub, title]] of Object.entries(updates)) {
  const path = 'src/sections/' + file;
  let content = fs.readFileSync(path, 'utf8');
  
  const header = `      <div className="animate-rise flex items-center justify-between">\n        <div>\n          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">${sub}</p>\n          <h1 className="font-display mt-1 text-2xl lg:text-3xl">${title}</h1>\n        </div>\n      </div>`;
  
  if (file === 'Onboarding.tsx') {
    content = content.replace(/<div className="animate-rise">\s*<p[^>]+>.*<\/p>\s*<h1[^>]+>.*<\/h1>/, `<div className="animate-rise">\n        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">${sub}</p>\n        <h1 className="font-display mt-1 text-2xl lg:text-3xl">${title}</h1>`);
  } else if (file === 'Library.tsx') {
    content = content.replace(/<div className="flex flex-wrap items-end justify-between gap-3 animate-rise">[\s\S]*?<\/div>/, header);
  } else if (file === 'Clients.tsx') {
    content = content.replace(/<div className="flex flex-wrap items-end justify-between gap-3 animate-rise">[\s\S]*?<div className="flex items-center gap-3/, header + '\n        <div className="flex items-center gap-3');
  } else if (file === 'Measurements.tsx') {
    content = content.replace(/<div className="flex items-end justify-between animate-rise">\s*<div>\s*<h1[^>]+>.*<\/h1>\s*<p[^>]+>.*<\/p>\s*<\/div>/, `<div className="flex items-end justify-between animate-rise">\n        <div>\n          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">${sub}</p>\n          <h1 className="font-display mt-1 text-2xl lg:text-3xl">${title}</h1>\n        </div>`);
  } else {
    content = content.replace(/<div className="animate-rise">[\s\S]*?<\/div>/, header);
  }
  
  // also fix rounded borders
  content = content.replace(/rounded-2xl/g, 'rounded-3xl');
  content = content.replace(/lg:text-4xl/g, 'lg:text-3xl');
  content = content.replace(/(<(?:button|input)[^>]+className=["'][^"']*)rounded-(?:xl|lg|2xl|3xl)([^"']*["'])/g, function(match, p1, p2) {
    return p1 + 'rounded-full' + p2;
  });

  fs.writeFileSync(path, content);
}
// and fix Plans detail and App.tsx
let plans = fs.readFileSync('src/sections/Plans.tsx', 'utf8');
plans = plans.replace(/<div>\s*<span className={`rounded-full[^>]+>{plan\.level}<\/span>\s*<h1[^>]+>{plan\.name}<\/h1>\s*<p[^>]+>{plan\.tagline}<\/p>\s*<\/div>/, `<div className="flex items-center justify-between">\n        <div>\n          <p className={\`text-xs font-medium uppercase tracking-[0.25em] \${LEVEL_STYLE[plan.level]}\`}>{plan.level}</p>\n          <h1 className="font-display mt-1 text-2xl lg:text-3xl">{plan.name}</h1>\n        </div>\n      </div>`);
fs.writeFileSync('src/sections/Plans.tsx', plans);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/rounded-2xl/g, 'rounded-3xl');
fs.writeFileSync('src/App.tsx', app);

let login = fs.readFileSync('src/sections/Login.tsx', 'utf8');
login = login.replace(/rounded-3xl bg-volt/g, 'rounded-full bg-volt');
fs.writeFileSync('src/sections/Login.tsx', login);

console.log('Headers and borders updated');
