import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Crown,
  Gauge,
  Handshake,
  RotateCcw,
  Scale,
  Settings2,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import "./styles.css";

type Zone = "pool" | "coalition" | "support";

type Bloc = "right" | "center" | "haredi" | "arab" | "left";

type Party = {
  id: string;
  name: string;
  short: string;
  seats: number;
  bloc: Bloc;
  color: string;
  logo: string;
  refuses: string[];
};

type Rules = {
  hardConflicts: boolean;
  minorityGovernment: boolean;
  ideologicalSpan: boolean;
  stability: boolean;
  requirePmParty: boolean;
  pmPartyId: string;
  majorityTarget: number;
  maxParties: number;
};

type DragState = {
  partyId: string;
  x: number;
  y: number;
  over: Zone | null;
};

const makorLogo =
  "/assets/makor-rishon-logo.svg";
const knessetHall = "/assets/knesset-hall.jpg";

const parties: Party[] = [
  {
    id: "likud",
    name: "הליכוד",
    short: "מחל",
    seats: 32,
    bloc: "right",
    color: "#1f64b5",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Likud%20Logo.svg",
    refuses: ["hadash-taal"],
  },
  {
    id: "yesh-atid",
    name: "יש עתיד",
    short: "פה",
    seats: 24,
    bloc: "center",
    color: "#13a8d8",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/YeshAtidLogo.svg",
    refuses: ["otzma", "noam"],
  },
  {
    id: "shas",
    name: "ש״ס",
    short: "שס",
    seats: 11,
    bloc: "haredi",
    color: "#26367d",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Shas%20logo.png",
    refuses: ["yisrael-beitenu"],
  },
  {
    id: "national-unity",
    name: "כחול לבן - המחנה הממלכתי",
    short: "כן",
    seats: 8,
    bloc: "center",
    color: "#214e8a",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/National%20Unity%20%28Israel%29%20logo.png",
    refuses: ["noam"],
  },
  {
    id: "utj",
    name: "יהדות התורה",
    short: "ג",
    seats: 7,
    bloc: "haredi",
    color: "#111827",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/United%20Torah%20Judaism%20logo.png",
    refuses: ["yisrael-beitenu"],
  },
  {
    id: "religious-zionism",
    name: "הציונות הדתית",
    short: "ט",
    seats: 7,
    bloc: "right",
    color: "#1f7a44",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/RZ%20logo%202023.svg",
    refuses: ["raam", "hadash-taal", "labor"],
  },
  {
    id: "otzma",
    name: "עוצמה יהודית",
    short: "ט",
    seats: 6,
    bloc: "right",
    color: "#f28c28",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Otzma%20Yehudit%202021%20logo.svg",
    refuses: ["raam", "hadash-taal", "labor", "yesh-atid"],
  },
  {
    id: "yisrael-beitenu",
    name: "ישראל ביתנו",
    short: "ל",
    seats: 6,
    bloc: "right",
    color: "#0f7db8",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Israel-beytenu-logo.svg",
    refuses: ["shas", "utj"],
  },
  {
    id: "raam",
    name: "רע״מ",
    short: "עם",
    seats: 5,
    bloc: "arab",
    color: "#168a53",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Raam%20logo%202021.svg",
    refuses: ["otzma", "religious-zionism", "noam"],
  },
  {
    id: "hadash-taal",
    name: "חד״ש-תע״ל",
    short: "ום",
    seats: 5,
    bloc: "arab",
    color: "#cf232f",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Hadash-Ta%27al%20logo.png",
    refuses: ["likud", "otzma", "religious-zionism", "noam"],
  },
  {
    id: "labor",
    name: "העבודה",
    short: "אמת",
    seats: 4,
    bloc: "left",
    color: "#d71958",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/HaAvoda%20Logo.svg",
    refuses: ["otzma", "religious-zionism", "noam"],
  },
  {
    id: "new-hope",
    name: "הימין הממלכתי",
    short: "ת",
    seats: 4,
    bloc: "right",
    color: "#2d6a4f",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/New%20Hope%20%28Israel%29%20logo.svg",
    refuses: ["hadash-taal"],
  },
  {
    id: "noam",
    name: "נעם",
    short: "נעם",
    seats: 1,
    bloc: "right",
    color: "#7f1d1d",
    logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Noam%20Party%20Logo.png",
    refuses: ["raam", "hadash-taal", "labor", "yesh-atid", "national-unity"],
  },
];

const blocLabel: Record<Bloc, string> = {
  right: "ימין",
  center: "מרכז",
  haredi: "חרדים",
  arab: "ערביות",
  left: "שמאל",
};

const blocWeight: Record<Bloc, number> = {
  left: 0,
  arab: 1,
  center: 2,
  haredi: 3,
  right: 4,
};

const defaultZones: Record<string, Zone> = Object.fromEntries(
  parties.map((party) => [party.id, "pool"])
);

const defaultRules: Rules = {
  hardConflicts: true,
  minorityGovernment: true,
  ideologicalSpan: true,
  stability: true,
  requirePmParty: false,
  pmPartyId: "likud",
  majorityTarget: 61,
  maxParties: 7,
};

function App() {
  const [zones, setZones] = useState<Record<string, Zone>>(defaultZones);
  const [rules, setRules] = useState<Rules>(defaultRules);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const byZone = useMemo(() => {
    const result: Record<Zone, Party[]> = { pool: [], coalition: [], support: [] };
    parties.forEach((party) => result[zones[party.id]].push(party));
    Object.values(result).forEach((list) =>
      list.sort((a, b) => b.seats - a.seats || a.name.localeCompare(b.name, "he"))
    );
    return result;
  }, [zones]);

  const stats = useMemo(() => evaluate(byZone, rules), [byZone, rules]);

  const setPartyZone = (partyId: string, zone: Zone) => {
    setZones((current) => ({ ...current, [partyId]: zone }));
  };

  const beginDrag = (event: React.PointerEvent, partyId: string) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setDrag({ partyId, x: event.clientX, y: event.clientY, over: zones[partyId] });
  };

  const moveDrag = (event: React.PointerEvent) => {
    if (!drag) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-zone]");
    const over = (target?.dataset.zone as Zone | undefined) ?? null;
    setDrag({ ...drag, x: event.clientX, y: event.clientY, over });
  };

  const finishDrag = () => {
    if (drag?.over) setPartyZone(drag.partyId, drag.over);
    setDrag(null);
  };

  return (
    <main className="app" onPointerMove={moveDrag} onPointerUp={finishDrag}>
      <header className="topbar">
        <div className="brand">
          <img src={makorLogo} alt="מקור ראשון" />
          <span>משחק הקואליציה</span>
        </div>
        <button className="ghostButton" onClick={() => setZones(defaultZones)}>
          <RotateCcw size={18} />
          איפוס
        </button>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">כנסת 25 | נתוני בחירות 2022 ופיצולי סיעות</p>
          <h1>מי מצליח להגיע ל־{rules.majorityTarget}?</h1>
          <div className="heroMeta" aria-label="מצב המשחק">
            <span>{stats.coalitionSeats} בקואליציה</span>
            <span>{stats.supportSeats} מבחוץ</span>
            <span>{parties.length} מפלגות</span>
          </div>
        </div>
        <div className="heroVisual">
          <img src={knessetHall} alt="" />
          <div className="heroOverlay">
            <ScoreGauge stats={stats} rules={rules} />
            <MandateWall zones={zones} />
          </div>
        </div>
      </section>

      <section className="workbench">
        <aside className="rulesPanel">
          <PanelTitle icon={<Settings2 size={19} />} title="חוקים" />
          <RuleToggle
            label="חסימות פוליטיות"
            checked={rules.hardConflicts}
            onChange={(checked) => setRules({ ...rules, hardConflicts: checked })}
          />
          <RuleToggle
            label="ממשלת מיעוט"
            checked={rules.minorityGovernment}
            onChange={(checked) => setRules({ ...rules, minorityGovernment: checked })}
          />
          <RuleToggle
            label="פער אידיאולוגי"
            checked={rules.ideologicalSpan}
            onChange={(checked) => setRules({ ...rules, ideologicalSpan: checked })}
          />
          <RuleToggle
            label="יציבות קואליציונית"
            checked={rules.stability}
            onChange={(checked) => setRules({ ...rules, stability: checked })}
          />
          <RuleToggle
            label="מפלגת רה״מ בפנים"
            checked={rules.requirePmParty}
            onChange={(checked) => setRules({ ...rules, requirePmParty: checked })}
          />

          <label className="fieldLabel">
            מפלגת רה״מ
            <select
              value={rules.pmPartyId}
              onChange={(event) => setRules({ ...rules, pmPartyId: event.target.value })}
            >
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </label>

          <label className="fieldLabel">
            יעד רוב
            <input
              type="range"
              min="61"
              max="80"
              value={rules.majorityTarget}
              onChange={(event) =>
                setRules({ ...rules, majorityTarget: Number(event.target.value) })
              }
            />
            <span className="rangeValue">{rules.majorityTarget} מנדטים</span>
          </label>

          <label className="fieldLabel">
            מקסימום מפלגות ליציבות
            <input
              type="range"
              min="3"
              max="10"
              value={rules.maxParties}
              onChange={(event) => setRules({ ...rules, maxParties: Number(event.target.value) })}
            />
            <span className="rangeValue">{rules.maxParties} מפלגות</span>
          </label>
        </aside>

        <section className="gameArea">
          <DropZone
            id="coalition"
            title="קואליציה"
            icon={<Crown size={21} />}
            parties={byZone.coalition}
            seats={stats.coalitionSeats}
            active={drag?.over === "coalition"}
            onPartyDrag={beginDrag}
            onQuickMove={setPartyZone}
          />
          <DropZone
            id="support"
            title="תמיכה מבחוץ"
            icon={<Handshake size={21} />}
            parties={byZone.support}
            seats={stats.supportSeats}
            active={drag?.over === "support"}
            onPartyDrag={beginDrag}
            onQuickMove={setPartyZone}
          />
          <DropZone
            id="pool"
            title="מפלגות זמינות"
            icon={<Users size={21} />}
            parties={byZone.pool}
            seats={120 - stats.coalitionSeats - stats.supportSeats}
            active={drag?.over === "pool"}
            onPartyDrag={beginDrag}
            onQuickMove={setPartyZone}
          />
        </section>

        <aside className="statusPanel">
          <PanelTitle icon={<Gauge size={19} />} title="סטטוס" />
          <StatusLine ok={stats.canGovern} label={stats.headline} />
          <div className="meters">
            <Metric label="קואליציה" value={stats.coalitionSeats} />
            <Metric label="עם תמיכה" value={stats.totalEffectiveSeats} />
            <Metric label="מפלגות" value={byZone.coalition.length} />
          </div>
          <div className="blocBars">
            {stats.blocs.map((item) => (
              <div key={item.bloc} className="blocRow">
                <span>{blocLabel[item.bloc]}</span>
                <div>
                  <i style={{ width: `${(item.seats / 120) * 100}%` }} />
                </div>
                <b>{item.seats}</b>
              </div>
            ))}
          </div>
          <IssueList issues={stats.issues} />
        </aside>
      </section>

      <MobilePartyDrawer
        open={mobileDrawerOpen}
        parties={parties}
        zones={zones}
        onOpen={() => setMobileDrawerOpen(true)}
        onClose={() => setMobileDrawerOpen(false)}
        onMove={setPartyZone}
      />

      {drag && (
        <div className="dragPreview" style={{ right: window.innerWidth - drag.x - 80, top: drag.y - 44 }}>
          <PartyCard
            party={parties.find((party) => party.id === drag.partyId)!}
            zone={zones[drag.partyId]}
            dragging
            onPointerDown={() => undefined}
            onQuickMove={() => undefined}
          />
        </div>
      )}
    </main>
  );
}

function evaluate(byZone: Record<Zone, Party[]>, rules: Rules) {
  const coalitionSeats = sumSeats(byZone.coalition);
  const supportSeats = sumSeats(byZone.support);
  const totalEffectiveSeats = coalitionSeats + supportSeats;
  const issues: { type: "error" | "warn"; text: string }[] = [];

  if (coalitionSeats < rules.majorityTarget) {
    if (!rules.minorityGovernment || totalEffectiveSeats < rules.majorityTarget) {
      issues.push({ type: "error", text: `חסרים ${rules.majorityTarget - Math.max(coalitionSeats, totalEffectiveSeats)} מנדטים לרוב.` });
    } else {
      issues.push({ type: "warn", text: "הרוב נשען על תמיכה מבחוץ." });
    }
  }

  if (rules.hardConflicts) {
    const selected = [...byZone.coalition, ...(rules.minorityGovernment ? byZone.support : [])];
    selected.forEach((party) => {
      party.refuses.forEach((otherId) => {
        const other = selected.find((candidate) => candidate.id === otherId);
        if (other && party.id < other.id) {
          issues.push({ type: "error", text: `${party.name} ו${other.name} מסומנות כחסומות יחד.` });
        }
      });
    });
  }

  if (rules.requirePmParty && !byZone.coalition.some((party) => party.id === rules.pmPartyId)) {
    const pmParty = parties.find((party) => party.id === rules.pmPartyId);
    issues.push({ type: "error", text: `${pmParty?.name ?? "מפלגת רה״מ"} לא בקואליציה.` });
  }

  if (rules.ideologicalSpan && byZone.coalition.length > 1) {
    const weights = byZone.coalition.map((party) => blocWeight[party.bloc]);
    if (Math.max(...weights) - Math.min(...weights) >= 4) {
      issues.push({ type: "warn", text: "פער אידיאולוגי רחב במיוחד." });
    }
  }

  if (rules.stability) {
    if (coalitionSeats < rules.majorityTarget + 4 && coalitionSeats >= rules.majorityTarget) {
      issues.push({ type: "warn", text: "רוב צר מאוד." });
    }
    if (byZone.coalition.length > rules.maxParties) {
      issues.push({ type: "warn", text: "יותר מדי מפלגות לפי כלל היציבות." });
    }
  }

  const bl = Object.entries(
    byZone.coalition.reduce<Record<Bloc, number>>(
      (acc, party) => ({ ...acc, [party.bloc]: acc[party.bloc] + party.seats }),
      { right: 0, center: 0, haredi: 0, arab: 0, left: 0 }
    )
  ).map(([bloc, seats]) => ({ bloc: bloc as Bloc, seats }));

  const hasBlockingError = issues.some((issue) => issue.type === "error");
  const canGovern =
    !hasBlockingError &&
    (coalitionSeats >= rules.majorityTarget ||
      (rules.minorityGovernment && totalEffectiveSeats >= rules.majorityTarget));

  return {
    coalitionSeats,
    supportSeats,
    totalEffectiveSeats,
    canGovern,
    headline: canGovern ? "אפשר להרכיב ממשלה" : "עדיין אין ממשלה",
    issues,
    blocs: bl,
  };
}

function sumSeats(list: Party[]) {
  return list.reduce((sum, party) => sum + party.seats, 0);
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panelTitle">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function ScoreGauge({ stats, rules }: { stats: ReturnType<typeof evaluate>; rules: Rules }) {
  const percent = Math.min(100, (stats.totalEffectiveSeats / rules.majorityTarget) * 100);
  return (
    <div className={`scoreGauge ${stats.canGovern ? "ready" : ""}`}>
      <div className="scoreRing" style={{ "--score": `${percent}%` } as React.CSSProperties}>
        <strong>{stats.coalitionSeats}</strong>
        <span>מנדטים</span>
      </div>
      <div>
        <b>{stats.canGovern ? "יש רוב" : "אין רוב"}</b>
        <span>{stats.supportSeats ? `${stats.totalEffectiveSeats} כולל תמיכה` : `יעד ${rules.majorityTarget}`}</span>
      </div>
    </div>
  );
}

function MandateWall({ zones }: { zones: Record<string, Zone> }) {
  const seats = parties.flatMap((party) =>
    Array.from({ length: party.seats }, (_, index) => ({
      id: `${party.id}-${index}`,
      party,
      zone: zones[party.id],
    }))
  );

  return (
    <div className="mandateWall" aria-hidden="true">
      {seats.map((seat) => (
        <i
          key={seat.id}
          className={`mandateSeat ${seat.zone}`}
          style={{ "--party": seat.party.color } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function RuleToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <i>{checked ? <Check size={15} /> : <X size={15} />}</i>
    </button>
  );
}

function DropZone({
  id,
  title,
  icon,
  parties: zoneParties,
  seats,
  active,
  onPartyDrag,
  onQuickMove,
}: {
  id: Zone;
  title: string;
  icon: React.ReactNode;
  parties: Party[];
  seats: number;
  active: boolean;
  onPartyDrag: (event: React.PointerEvent, partyId: string) => void;
  onQuickMove: (partyId: string, zone: Zone) => void;
}) {
  return (
    <section className={`dropZone ${active ? "active" : ""}`} data-zone={id}>
      <div className="zoneHeader">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
        <b>{seats}</b>
      </div>
      <div className="partyGrid">
        {zoneParties.map((party) => (
          <PartyCard
            key={party.id}
            party={party}
            zone={id}
            onPointerDown={(event) => onPartyDrag(event, party.id)}
            onQuickMove={onQuickMove}
          />
        ))}
      </div>
    </section>
  );
}

function PartyCard({
  party,
  zone,
  dragging = false,
  onPointerDown,
  onQuickMove,
}: {
  party: Party;
  zone: Zone;
  dragging?: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onQuickMove: (partyId: string, zone: Zone) => void;
}) {
  const [failed, setFailed] = useState(false);
  const quickTarget: Zone = zone === "coalition" ? "pool" : "coalition";
  return (
    <article
      className={`partyCard ${dragging ? "dragging" : ""}`}
      onPointerDown={onPointerDown}
      style={{ "--party": party.color } as React.CSSProperties}
    >
      <div className="partyLogo" aria-hidden="true">
        {!failed && <img src={party.logo} alt="" onError={() => setFailed(true)} draggable={false} />}
        {failed && <span>{party.short}</span>}
      </div>
      <div className="partyMain">
        <h3>{party.name}</h3>
        <span>{blocLabel[party.bloc]}</span>
      </div>
      <b className="seats">{party.seats}</b>
      {!dragging && (
        <button
          className="moveButton"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onQuickMove(party.id, quickTarget)}
          title={quickTarget === "coalition" ? "לקואליציה" : "החוצה"}
        >
          <ArrowLeftRight size={16} />
        </button>
      )}
    </article>
  );
}

function MobilePartyDrawer({
  open,
  parties: drawerParties,
  zones,
  onOpen,
  onClose,
  onMove,
}: {
  open: boolean;
  parties: Party[];
  zones: Record<string, Zone>;
  onOpen: () => void;
  onClose: () => void;
  onMove: (partyId: string, zone: Zone) => void;
}) {
  const poolCount = drawerParties.filter((party) => zones[party.id] === "pool").length;
  const coalitionSeats = sumSeats(drawerParties.filter((party) => zones[party.id] === "coalition"));
  const supportSeats = sumSeats(drawerParties.filter((party) => zones[party.id] === "support"));

  return (
    <div className={`mobilePartyDock ${open ? "open" : ""}`}>
      <button className="mobileDockButton" onClick={onOpen}>
        <Users size={18} />
        <span>מפלגות</span>
        <b>{poolCount}</b>
      </button>
      {open && <button className="mobileScrim" aria-label="סגירה" onClick={onClose} />}
      <section className="mobilePartySheet" aria-hidden={!open}>
        <div className="mobileSheetHandle" />
        <div className="mobileSheetHeader">
          <div>
            <h2>מפלגות</h2>
            <span>{coalitionSeats} בקואליציה · {supportSeats} תמיכה</span>
          </div>
          <button className="sheetClose" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>
        <div className="mobilePartyList">
          {drawerParties
            .slice()
            .sort((a, b) => {
              const zoneRank: Record<Zone, number> = { pool: 0, coalition: 1, support: 2 };
              return zoneRank[zones[a.id]] - zoneRank[zones[b.id]] || b.seats - a.seats;
            })
            .map((party) => (
              <MobilePartyRow
                key={party.id}
                party={party}
                zone={zones[party.id]}
                onMove={onMove}
              />
            ))}
        </div>
      </section>
    </div>
  );
}

function MobilePartyRow({
  party,
  zone,
  onMove,
}: {
  party: Party;
  zone: Zone;
  onMove: (partyId: string, zone: Zone) => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="mobilePartyRow" style={{ "--party": party.color } as React.CSSProperties}>
      <div className="partyLogo" aria-hidden="true">
        {!failed && <img src={party.logo} alt="" onError={() => setFailed(true)} draggable={false} />}
        {failed && <span>{party.short}</span>}
      </div>
      <div className="mobilePartyInfo">
        <h3>{party.name}</h3>
        <span>{party.seats} מנדטים · {zoneLabel(zone)}</span>
      </div>
      <div className="mobilePartyActions">
        <button
          className={zone === "coalition" ? "selected" : ""}
          onClick={() => onMove(party.id, zone === "coalition" ? "pool" : "coalition")}
        >
          <Crown size={15} />
          <span>קואליציה</span>
        </button>
        <button
          className={zone === "support" ? "selected" : ""}
          onClick={() => onMove(party.id, zone === "support" ? "pool" : "support")}
        >
          <Handshake size={15} />
          <span>תמיכה</span>
        </button>
      </div>
    </article>
  );
}

function zoneLabel(zone: Zone) {
  if (zone === "coalition") return "בקואליציה";
  if (zone === "support") return "תמיכה מבחוץ";
  return "זמינה";
}

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`statusLine ${ok ? "ok" : "bad"}`}>
      {ok ? <Sparkles size={18} /> : <ShieldAlert size={18} />}
      <span>{label}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function IssueList({ issues }: { issues: { type: "error" | "warn"; text: string }[] }) {
  if (!issues.length) {
    return (
      <div className="emptyIssues">
        <Scale size={18} />
        אין התנגשויות פעילות
      </div>
    );
  }

  return (
    <div className="issues">
      {issues.map((issue, index) => (
        <div key={`${issue.text}-${index}`} className={`issue ${issue.type}`}>
          <AlertTriangle size={17} />
          <span>{issue.text}</span>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
