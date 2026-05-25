import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Coins,
  Crown,
  Dumbbell,
  Flame,
  Gem,
  Save,
  Shield,
  Swords,
  Trash2,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";

const STORAGE_KEY = "solo-leveling-life-os-minimal-v1";

const initialState = {
  rank: "E",
  level: 1,
  xpTotal: 0,
  currentWeek: 1,
  currentBoss: "Утренний туман",
  bossHpTotal: 700,
  bossHpLeft: 700,
  crystalsSpent: 0,
  crystalsPenalty: 0,
  entries: [],
  purchases: [],
  penalties: [],
};

const branches = [
  { key: "body", label: "Тело", icon: Dumbbell },
  { key: "capital", label: "Капитал", icon: Coins },
  { key: "influence", label: "Влияние", icon: Crown },
  { key: "mind", label: "Разум", icon: BookOpen },
  { key: "will", label: "Воля", icon: Flame },
];

const rewards = [
  { name: "1 вкусняшка", type: "Еда", description: "шоколадка / чипсы", price: 2 },
  { name: "Напиток", type: "Еда", description: "кофе / бабл-ти / энергетик", price: 2 },
  { name: "1 час YouTube / Twitch", type: "Отдых", description: "контент по таймеру", price: 3 },
  { name: "Вечер игры 1 час", type: "Отдых", description: "1 катка после минимума", price: 3 },
  { name: "Фильм / 2 серии", type: "Отдых", description: "спокойно, без ощущения слива", price: 3 },
  { name: "Маленькая покупка до 300 ₽", type: "Вещь", description: "мелочь / канцелярия / декор", price: 5 },
  { name: "Купить книжку", type: "Вещь", description: "книга как награда", price: 6 },
  { name: "Вечер игры 3 часа", type: "Отдых", description: "только после минимума", price: 6 },
];

const penaltyTypes = [
  { name: "Не выбрал главный квест", price: 1 },
  { name: "Не сделал дневной минимум", price: 2 },
  { name: "Не атаковал босса", price: 1 },
  { name: "Утром залип в телефон", price: 1 },
  { name: "2 провала подряд", price: 3 },
  { name: "3 провала подряд", price: 5 },
  { name: "Неделя: босс не повержен", price: 3 },
];

const questExamples = [
  { branch: "Капитал", quest: "90 минут глубокой работы по Brelkof", xp: 60 },
  { branch: "Капитал", quest: "Разобрать цифры бизнеса и сделать 1 вывод", xp: 70 },
  { branch: "Капитал", quest: "Закрыть операционную задачу", xp: 80 },
  { branch: "Влияние", quest: "90 минут работы над YouTube / контентом", xp: 60 },
  { branch: "Влияние", quest: "Написать законченный блок сценария", xp: 70 },
  { branch: "Влияние", quest: "Сделать публичный шаг", xp: 80 },
  { branch: "Воля", quest: "Сделать главное дело дня до 13:00", xp: 70 },
  { branch: "Воля", quest: "Закрыть отложенную задачу", xp: 80 },
  { branch: "Воля", quest: "Утро без автопилота", xp: 80 },
];

const bossAttacks = [
  { attack: "Встал без телефона", hp: 25 },
  { attack: "Первые 30 минут без телефона", hp: 35 },
  { attack: "Вода / душ / физический запуск", hp: 20 },
  { attack: "Главное дело начато до 13:00", hp: 40 },
  { attack: "Утро без YouTube / новостей", hp: 30 },
  { attack: "Прогулка утром", hp: 25 },
  { attack: "Завтрак без телефона", hp: 20 },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function getLevelByXp(xp) {
  if (xp >= 8500) return 10;
  if (xp >= 7000) return 9;
  if (xp >= 5700) return 8;
  if (xp >= 4500) return 7;
  if (xp >= 3500) return 6;
  if (xp >= 2600) return 5;
  if (xp >= 1800) return 4;
  if (xp >= 1100) return 3;
  if (xp >= 500) return 2;
  return 1;
}

function getRankByLevel(level) {
  if (level >= 51) return "S";
  if (level >= 36) return "A";
  if (level >= 21) return "B";
  if (level >= 11) return "C";
  if (level >= 6) return "D";
  return "E";
}

function getNextLevelXp(xp) {
  const marks = [500, 1100, 1800, 2600, 3500, 4500, 5700, 7000, 8500];
  return marks.find((m) => xp < m) || xp + 1000;
}

function sum(entries, key) {
  return entries.reduce((acc, item) => acc + Number(item[key] || 0), 0);
}

function Stat({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-50">{value}</div>
          {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
        </div>
        {Icon && <Icon className="text-zinc-500" size={22} />}
      </div>
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">{title}</h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm text-zinc-400">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 ${props.className || ""}`}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
    />
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  const styles = variant === "primary"
    ? "bg-zinc-100 text-zinc-950 hover:bg-white"
    : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900";
  return <button {...props} className={`${base} ${styles} ${className}`}>{children}</button>;
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [entry, setEntry] = useState({
    date: todayIso(),
    day: "Пн",
    mainQuest: "",
    dailyMinimum: "",
    body: 0,
    capital: 0,
    influence: 0,
    mind: 0,
    will: 0,
    hpDamage: 0,
    note: "",
  });
  const [penalty, setPenalty] = useState(penaltyTypes[0].name);
  const importRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const xpDay = branches.reduce((acc, branch) => acc + Number(entry[branch.key] || 0), 0);
  const level = getLevelByXp(state.xpTotal);
  const rank = getRankByLevel(level);
  const nextXp = getNextLevelXp(state.xpTotal);
  const crystalsEarned = Math.floor(state.xpTotal / 100);
  const crystalBalance = crystalsEarned - state.crystalsSpent - state.crystalsPenalty;
  const bossDamage = state.bossHpTotal - state.bossHpLeft;
  const latestEntries = state.entries.slice(0, 7);

  const weekTotals = useMemo(() => {
    const latest = state.entries.slice(0, 7);
    return Object.fromEntries(branches.map((b) => [b.key, sum(latest, b.key)]));
  }, [state.entries]);

  function saveEntry() {
    const hpDamage = Math.min(100, Math.max(0, Number(entry.hpDamage || 0)));
    const saved = {
      ...entry,
      body: Number(entry.body || 0),
      capital: Number(entry.capital || 0),
      influence: Number(entry.influence || 0),
      mind: Number(entry.mind || 0),
      will: Number(entry.will || 0),
      hpDamage,
      xp: xpDay,
    };
    const newXp = state.xpTotal + xpDay;
    const newLevel = getLevelByXp(newXp);
    const newBossHp = Math.max(0, state.bossHpLeft - hpDamage);

    setState((prev) => ({
      ...prev,
      xpTotal: newXp,
      level: newLevel,
      rank: getRankByLevel(newLevel),
      bossHpLeft: newBossHp,
      entries: [saved, ...prev.entries].slice(0, 200),
    }));

    setEntry({
      date: todayIso(),
      day: "Пн",
      mainQuest: "",
      dailyMinimum: "",
      body: 0,
      capital: 0,
      influence: 0,
      mind: 0,
      will: 0,
      hpDamage: 0,
      note: "",
    });
  }

  function buyReward(reward) {
    if (crystalBalance < reward.price) return;
    setState((prev) => ({
      ...prev,
      crystalsSpent: prev.crystalsSpent + reward.price,
      purchases: [{ ...reward, date: todayIso() }, ...prev.purchases].slice(0, 100),
    }));
  }

  function addPenalty() {
    const item = penaltyTypes.find((p) => p.name === penalty);
    if (!item) return;
    setState((prev) => ({
      ...prev,
      crystalsPenalty: prev.crystalsPenalty + item.price,
      penalties: [{ ...item, date: todayIso() }, ...prev.penalties].slice(0, 100),
    }));
  }

  function newWeek() {
    setState((prev) => ({
      ...prev,
      currentWeek: prev.currentWeek + 1,
      bossHpLeft: prev.bossHpTotal,
    }));
  }

  function exportData() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solo-life-os-backup-${todayIso()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const restored = { ...initialState, ...parsed };
        setState(restored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      } catch {
        window.alert("Не удалось импортировать файл. Проверь, что это JSON-бэкап Solo Life OS.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function resetAll() {
    const ok = window.confirm("Сбросить весь прогресс? Это действие нельзя отменить.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-zinc-500">
              <Swords size={14} /> MVP · local build
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Solo Leveling Life OS</h1>
            <p className="mt-2 text-sm text-zinc-500">Минималистичный dashboard. Данные пока сохраняются локально в браузере.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}><Download size={16} /> Экспорт</Button>
            <Button variant="secondary" onClick={() => importRef.current?.click()}><Upload size={16} /> Импорт</Button>
            <input ref={importRef} type="file" accept="application/json" onChange={importData} className="hidden" />
            <Button variant="secondary" onClick={newWeek}><RotateCcw size={16} /> Новая неделя</Button>
            <Button variant="secondary" onClick={resetAll}><Trash2 size={16} /> Сброс</Button>
          </div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Ранг / уровень" value={`${rank} · LV ${level}`} sub="уровень не откатывается" icon={Shield} />
          <Stat label="XP всего" value={state.xpTotal} sub={`до следующего: ${Math.max(0, nextXp - state.xpTotal)}`} icon={Save} />
          <Stat label="Кристаллы" value={crystalBalance} sub={`заработано: ${crystalsEarned}`} icon={Gem} />
          <Stat label="Босс" value={`${state.bossHpLeft}/700`} sub={state.currentBoss} icon={Flame} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Section title="Дневник дня" right={<span className="text-xs text-zinc-500">XP дня: {xpDay}</span>}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Дата"><Input type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></Field>
              <Field label="День"><Select value={entry.day} onChange={(e) => setEntry({ ...entry, day: e.target.value })}>{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => <option key={d}>{d}</option>)}</Select></Field>
              <Field label="HP урон боссу"><Input type="number" min="0" max="100" value={entry.hpDamage} onChange={(e) => setEntry({ ...entry, hpDamage: e.target.value })} /></Field>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Главный квест дня"><Input value={entry.mainQuest} onChange={(e) => setEntry({ ...entry, mainQuest: e.target.value })} placeholder="например: 90 минут Brelkof" /></Field>
              <Field label="Дневной минимум"><Input value={entry.dailyMinimum} onChange={(e) => setEntry({ ...entry, dailyMinimum: e.target.value })} placeholder="минимум, который держит день" /></Field>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-zinc-900 text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <tr>
                    <th className="px-3 py-3">Навык</th>
                    <th className="px-3 py-3">XP</th>
                    <th className="px-3 py-3">Смысл</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(({ key, label, icon: Icon }) => (
                    <tr key={key} className="border-t border-zinc-800">
                      <td className="px-3 py-3 font-medium"><span className="inline-flex items-center gap-2"><Icon size={16} className="text-zinc-500" />{label}</span></td>
                      <td className="w-36 px-3 py-3"><Input type="number" min="0" value={entry[key]} onChange={(e) => setEntry({ ...entry, [key]: e.target.value })} /></td>
                      <td className="px-3 py-3 text-zinc-500">запиши только число, справочник ниже</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Field label="Комментарий" >
              <textarea
                value={entry.note}
                onChange={(e) => setEntry({ ...entry, note: e.target.value })}
                placeholder="коротко: что сработало, где был автопилот, что понял"
                className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
              />
            </Field>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="text-sm text-zinc-400">
                После сохранения: <span className="font-semibold text-zinc-100">+{xpDay} XP</span> · кристаллы считаются от общего XP
              </div>
              <Button onClick={saveEntry}><Save size={16} /> Сохранить</Button>
            </div>
          </Section>

          <Section title="Босс недели">
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm text-zinc-400"><span>{state.currentBoss}</span><span>{state.bossHpLeft}/700 HP</span></div>
                <div className="h-3 rounded-full border border-zinc-800 bg-zinc-900">
                  <div className="h-full rounded-full bg-zinc-200" style={{ width: `${Math.min(100, (bossDamage / state.bossHpTotal) * 100)}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[1,2,3,4,5,6,7].map((n) => (
                  <div key={n} className={`rounded-lg border px-2 py-2 text-center text-xs ${bossDamage >= n * 100 ? "border-zinc-100 bg-zinc-100 text-zinc-950" : "border-zinc-800 bg-zinc-900 text-zinc-500"}`}>{n}</div>
                ))}
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Flame size={16} /> Утренний туман</div>
                <p className="text-sm text-zinc-500">Сонливость, телефон, откладывание старта. Максимум 100 HP урона в день.</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-left text-xs uppercase tracking-[0.16em] text-zinc-500"><tr><th className="px-3 py-2">Атака</th><th className="px-3 py-2 text-right">HP</th></tr></thead>
                  <tbody>
                    {bossAttacks.map((a) => <tr key={a.attack} className="border-t border-zinc-800"><td className="px-3 py-2 text-zinc-300">{a.attack}</td><td className="px-3 py-2 text-right font-medium">-{a.hp}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          {branches.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{label}</span><Icon className="text-zinc-500" size={17} /></div>
              <div className="mt-3 text-2xl font-semibold">{weekTotals[key] || 0}</div>
              <div className="mt-1 text-xs text-zinc-500">за последние 7 записей</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Section title="Магазин наград" right={<span className="text-xs text-zinc-500">баланс: {crystalBalance}</span>}>
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <tr><th className="px-3 py-3">Награда</th><th className="px-3 py-3">Тип</th><th className="px-3 py-3 text-right">Цена</th><th className="px-3 py-3"></th></tr>
                </thead>
                <tbody>
                  {rewards.map((r) => (
                    <tr key={r.name} className="border-t border-zinc-800">
                      <td className="px-3 py-3"><div className="font-medium">{r.name}</div><div className="text-xs text-zinc-500">{r.description}</div></td>
                      <td className="px-3 py-3 text-zinc-400">{r.type}</td>
                      <td className="px-3 py-3 text-right font-medium">{r.price}</td>
                      <td className="px-3 py-3 text-right"><Button variant="secondary" disabled={crystalBalance < r.price} onClick={() => buyReward(r)}>Купить</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Штрафы и последние записи">
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Select value={penalty} onChange={(e) => setPenalty(e.target.value)}>
                {penaltyTypes.map((p) => <option key={p.name}>{p.name} · -{p.price}</option>)}
              </Select>
              <Button variant="secondary" onClick={addPenalty}>Списать</Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <tr><th className="px-3 py-3">Дата</th><th className="px-3 py-3">Квест</th><th className="px-3 py-3 text-right">XP</th></tr>
                </thead>
                <tbody>
                  {latestEntries.length ? latestEntries.map((item, idx) => (
                    <tr key={idx} className="border-t border-zinc-800">
                      <td className="px-3 py-3 text-zinc-400">{item.date}</td>
                      <td className="px-3 py-3"><div>{item.mainQuest || "—"}</div><div className="text-xs text-zinc-500">{item.note}</div></td>
                      <td className="px-3 py-3 text-right font-medium">{item.xp}</td>
                    </tr>
                  )) : <tr><td colSpan="3" className="px-3 py-6 text-center text-zinc-500">Записей пока нет</td></tr>}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Section title="Квесты дня">
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-left text-xs uppercase tracking-[0.16em] text-zinc-500"><tr><th className="px-3 py-3">Ветка</th><th className="px-3 py-3">Квест</th><th className="px-3 py-3 text-right">XP</th></tr></thead>
                <tbody>{questExamples.map((q) => <tr key={q.quest} className="border-t border-zinc-800"><td className="px-3 py-3 text-zinc-400">{q.branch}</td><td className="px-3 py-3">{q.quest}</td><td className="px-3 py-3 text-right font-medium">{q.xp}</td></tr>)}</tbody>
              </table>
            </div>
          </Section>

          <Section title="Памятка">
            <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">1 главный квест в день.</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">Максимум 100 HP урона боссу в день.</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">XP не отнимается. Штрафы снимают кристаллы.</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">Google Sheets пока остаётся справочником и резервной базой.</div>
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}
