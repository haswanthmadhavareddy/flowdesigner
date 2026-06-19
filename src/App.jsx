import { useState, useEffect, useRef } from "react";

// ── palette & tokens ──────────────────────────────────────────────────────────
// SAP Horizon-inspired but distinctly darker and more "engineering tool"
// Primary: deep navy #0A1628  Surface: #0F2040  Accent: #0070F2 (SAP blue)
// Success: #1CB35B  Warn: #E8A000  Error: #E53935  Muted: #8B9AB0
// Mono font for node labels, Inter-like sans for UI

const COLORS = {
  bg: "#0A1628",
  surface: "#0F2040",
  surfaceHigh: "#162848",
  border: "#1E3A5F",
  accent: "#0070F2",
  accentDim: "#003D8F",
  accentGlow: "rgba(0,112,242,0.18)",
  success: "#1CB35B",
  warn: "#E8A000",
  error: "#E53935",
  muted: "#8B9AB0",
  text: "#E8EEF8",
  textDim: "#6B7FA3",
  nodeStart: "#1CB35B",
  nodeSender: "#0070F2",
  nodeProcessor: "#7C3AED",
  nodeMapper: "#DB6400",
  nodeRouter: "#0891B2",
  nodeReqReply: "#BE185D",
  nodeReceiver: "#D97706",
  nodeEnd: "#E53935",
};

// ── tiny helpers ──────────────────────────────────────────────────────────────
const Dot = ({ color, size = 8 }) => (
  <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, marginRight:6, flexShrink:0 }} />
);

const Badge = ({ children, color = COLORS.accent, bg }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", padding:"2px 10px", borderRadius:20,
    fontSize:11, fontWeight:700, letterSpacing:.5,
    background: bg || color+"22", color, border:`1px solid ${color}44`,
  }}>{children}</span>
);

const Card = ({ children, style, onClick, hover }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: hov ? COLORS.surfaceHigh : COLORS.surface,
        border:`1px solid ${hov ? COLORS.accent : COLORS.border}`,
        borderRadius:12, transition:"all .18s", cursor: onClick ? "pointer" : "default",
        boxShadow: hov ? `0 0 0 1px ${COLORS.accent}44, 0 4px 24px #00000040` : "none",
        ...style
      }}
    >{children}</div>
  );
};

const Btn = ({ children, onClick, variant="primary", disabled, style }) => {
  const [hov, setHov] = useState(false);
  const base = {
    display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px",
    borderRadius:8, fontWeight:600, fontSize:13, cursor: disabled?"not-allowed":"pointer",
    border:"none", transition:"all .16s", opacity: disabled ? .45 : 1, ...style
  };
  const variants = {
    primary: { background: hov ? "#0060D9" : COLORS.accent, color:"#fff", boxShadow: hov?"0 0 0 3px #0070F240":"none" },
    ghost: { background: hov ? COLORS.accentGlow : "transparent", color: hov ? COLORS.accent : COLORS.muted, border:`1px solid ${COLORS.border}` },
    danger: { background: hov ? "#C62828" : COLORS.error, color:"#fff" },
    success: { background: hov ? "#158040" : COLORS.success, color:"#fff" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant] }}
    >{children}</button>
  );
};

const ProgressBar = ({ value, color = COLORS.accent }) => (
  <div style={{ height:6, background:COLORS.border, borderRadius:3, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:3, transition:"width .6s ease" }} />
  </div>
);

const Input = ({ label, value, onChange, placeholder, type="text", required }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:6, letterSpacing:.4 }}>
      {label}{required && <span style={{ color:COLORS.error }}> *</span>}
    </label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width:"100%", padding:"10px 14px", background:COLORS.bg, border:`1px solid ${COLORS.border}`,
        borderRadius:8, color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box",
        transition:"border .15s",
      }}
      onFocus={e => e.target.style.borderColor = COLORS.accent}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    />
  </div>
);

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:12, fontWeight:600, color:COLORS.muted, marginBottom:6, letterSpacing:.4 }}>
      {label}{required && <span style={{ color:COLORS.error }}> *</span>}
    </label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", padding:"10px 14px", background:COLORS.bg, border:`1px solid ${COLORS.border}`,
        borderRadius:8, color: value ? COLORS.text : COLORS.textDim, fontSize:13, outline:"none", boxSizing:"border-box",
      }}
      onFocus={e => e.target.style.borderColor = COLORS.accent}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = [
  { id:1, label:"Capture" },
  { id:2, label:"Requirements" },
  { id:3, label:"Validation" },
  { id:4, label:"Blueprint" },
  { id:5, label:"Visual Flow" },
];

const StepBar = ({ current }) => (
  <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:40 }}>
    {STEPS.map((s, i) => (
      <div key={s.id} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{
            width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:700, fontSize:13,
            background: current > s.id ? COLORS.success : current === s.id ? COLORS.accent : COLORS.border,
            color: current >= s.id ? "#fff" : COLORS.muted,
            border: current === s.id ? `2px solid #fff` : "2px solid transparent",
            boxShadow: current === s.id ? `0 0 0 3px ${COLORS.accentGlow}` : "none",
            transition:"all .3s",
          }}>
            {current > s.id ? "✓" : s.id}
          </div>
          <span style={{ fontSize:10, fontWeight:600, color: current === s.id ? COLORS.accent : COLORS.muted, letterSpacing:.5, whiteSpace:"nowrap" }}>
            {s.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div style={{ flex:1, height:2, background: current > s.id ? COLORS.success : COLORS.border, margin:"0 8px", marginBottom:22, transition:"background .3s" }} />
        )}
      </div>
    ))}
  </div>
);

// ── Step 1: Natural Language Capture ─────────────────────────────────────────
const Step1 = ({ onNext }) => {
  const [text, setText] = useState("");
  const examples = [
    "Create an integration from SuccessFactors to S/4HANA. Synchronize employee data daily at midnight. Retry on failure 3 times and notify support@company.com.",
    "Integrate SAP ECC purchase orders to an external logistics API via REST. Transform IDOC to JSON. Run hourly with SFTP fallback.",
    "Sync customer master data from CRM to SAP MDG every 15 minutes. Apply field-level mapping and raise alerts on duplicate detection.",
  ];
  return (
    <div>
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:COLORS.accentGlow, border:`1px solid ${COLORS.accent}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔗</div>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:COLORS.text }}>Describe your integration</h2>
            <p style={{ margin:0, fontSize:13, color:COLORS.muted }}>Use plain language — AI will extract and fill in the details</p>
          </div>
        </div>
      </div>

      <div style={{ position:"relative", marginBottom:20 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. Create an integration from SuccessFactors to S/4HANA. Sync employee data daily. Retry failures and notify support team."
          rows={5}
          style={{
            width:"100%", padding:"16px", background:COLORS.bg, border:`1.5px solid ${text ? COLORS.accent : COLORS.border}`,
            borderRadius:12, color:COLORS.text, fontSize:14, lineHeight:1.7, outline:"none",
            resize:"vertical", boxSizing:"border-box", fontFamily:"inherit",
            transition:"border .2s",
          }}
          onFocus={e => e.target.style.borderColor = COLORS.accent}
          onBlur={e => e.target.style.borderColor = text ? COLORS.accent : COLORS.border}
        />
        <div style={{ position:"absolute", bottom:14, right:14, fontSize:11, color:COLORS.textDim }}>
          {text.length} chars
        </div>
      </div>

      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:11, fontWeight:700, color:COLORS.muted, letterSpacing:.8, marginBottom:10 }}>QUICK EXAMPLES</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {examples.map((ex, i) => (
            <Card key={i} hover onClick={() => setText(ex)} style={{ padding:"10px 14px", cursor:"pointer" }}>
              <p style={{ margin:0, fontSize:12, color:COLORS.textDim, lineHeight:1.6 }}>{ex}</p>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn onClick={() => text.trim().length > 10 && onNext(text)} disabled={text.trim().length <= 10}>
          Analyze Requirement →
        </Btn>
      </div>
    </div>
  );
};

// ── Step 2: Intelligent Form Collection ──────────────────────────────────────
const extractFromText = (text) => {
  const t = text.toLowerCase();
  return {
    sourceSystem: t.includes("successfactors") ? "SAP SuccessFactors" : t.includes("ecc") ? "SAP ECC" : t.includes("crm") ? "SAP CRM" : "",
    targetSystem: t.includes("s/4") || t.includes("s4") ? "SAP S/4HANA" : t.includes("mdg") ? "SAP MDG" : t.includes("logistic") ? "External Logistics API" : "",
    dataObject: t.includes("employee") ? "Employee Master" : t.includes("purchase order") || t.includes("idoc") ? "Purchase Order / IDOC" : t.includes("customer") ? "Customer Master" : "",
    frequency: t.includes("daily") ? "Daily (Scheduled)" : t.includes("hourly") ? "Every Hour" : t.includes("15 min") ? "Every 15 Minutes" : "",
    errorHandling: t.includes("retry") ? "Retry + Notify" : "",
    notificationEmail: (() => { const m = text.match(/[\w.-]+@[\w.-]+/); return m ? m[0] : ""; })(),
  };
};

const Step2 = ({ rawText, onNext }) => {
  const prefilled = extractFromText(rawText);
  const [form, setForm] = useState({
    sourceSystem: prefilled.sourceSystem,
    targetSystem: prefilled.targetSystem,
    dataObject: prefilled.dataObject,
    frequency: prefilled.frequency,
    authType: "",
    dataFormat: "",
    errorHandling: prefilled.errorHandling,
    retryCount: "3",
    notificationEmail: prefilled.notificationEmail,
    monitoringLevel: "",
    transformationRequired: "",
    fieldMapping: "",
  });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]:v }));

  const autoFilled = Object.entries(prefilled).filter(([,v]) => v).map(([k]) => k);
  const requiredFilled = form.sourceSystem && form.targetSystem && form.dataObject && form.frequency && form.authType && form.dataFormat;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"#7C3AED22", border:"1px solid #7C3AED44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🤖</div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:COLORS.text }}>Complete Requirements</h2>
          <p style={{ margin:0, fontSize:13, color:COLORS.muted }}>AI pre-filled {autoFilled.length} fields from your description</p>
        </div>
        {autoFilled.length > 0 && <Badge color={COLORS.success}>{autoFilled.length} auto-filled</Badge>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
        <Select label="Source System" value={form.sourceSystem} onChange={f("sourceSystem")} required
          options={["SAP SuccessFactors","SAP ECC","SAP CRM","SAP Ariba","SAP Concur","External REST API","SFTP Source"]} />
        <Select label="Target System" value={form.targetSystem} onChange={f("targetSystem")} required
          options={["SAP S/4HANA","SAP MDG","SAP BTP","External Logistics API","SAP Ariba","Azure Service Bus","AWS S3"]} />
        <Input label="Data Object / Entity" value={form.dataObject} onChange={f("dataObject")} placeholder="e.g. Employee Master, Sales Order" required />
        <Select label="Trigger / Frequency" value={form.frequency} onChange={f("frequency")} required
          options={["Real-Time (Event)","Every 5 Minutes","Every 15 Minutes","Every Hour","Daily (Scheduled)","Weekly","On-Demand"]} />
        <Select label="Authentication Type" value={form.authType} onChange={f("authType")} required
          options={["OAuth 2.0","Basic Auth","Certificate (X.509)","API Key","SAML 2.0","None"]} />
        <Select label="Data Format" value={form.dataFormat} onChange={f("dataFormat")} required
          options={["XML","JSON","IDOC","CSV","Flat File","OData","SOAP"]} />
        <Select label="Error Handling Strategy" value={form.errorHandling} onChange={f("errorHandling")}
          options={["Retry + Notify","Dead Letter Queue","Alert Only","Discard","Custom"]} />
        <Input label="Retry Count" value={form.retryCount} onChange={f("retryCount")} placeholder="3" type="number" />
        <Input label="Notification Email" value={form.notificationEmail} onChange={f("notificationEmail")} placeholder="ops@company.com" />
        <Select label="Monitoring Level" value={form.monitoringLevel} onChange={f("monitoringLevel")}
          options={["None","Error Only","Warning + Error","Full Trace"]} />
        <Select label="Transformation Required" value={form.transformationRequired} onChange={f("transformationRequired")}
          options={["Yes – Message Mapping","Yes – XSLT","Yes – Groovy (describe)","No transformation needed"]} />
        <Select label="Field Mapping Complexity" value={form.fieldMapping} onChange={f("fieldMapping")}
          options={["Simple (1:1 fields)","Moderate (derived fields)","Complex (aggregation, lookups)","Unknown – AI suggest"]} />
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
        <span style={{ fontSize:12, color:COLORS.muted }}>
          {requiredFilled ? "✅ Required fields complete" : "⚠ Fill required (*) fields to continue"}
        </span>
        <Btn onClick={() => requiredFilled && onNext(form)} disabled={!requiredFilled}>
          Validate Requirements →
        </Btn>
      </div>
    </div>
  );
};

// ── Step 3: Validation ────────────────────────────────────────────────────────
const validateRequirements = (form) => {
  const checks = [
    { id:"src", label:"Source system defined", pass:!!form.sourceSystem, critical:true },
    { id:"tgt", label:"Target system defined", pass:!!form.targetSystem, critical:true },
    { id:"obj", label:"Data object specified", pass:!!form.dataObject, critical:true },
    { id:"auth", label:"Authentication configured", pass:!!form.authType, critical:true },
    { id:"fmt", label:"Data format specified", pass:!!form.dataFormat, critical:true },
    { id:"freq", label:"Trigger/frequency defined", pass:!!form.frequency, critical:true },
    { id:"err", label:"Error handling strategy set", pass:!!form.errorHandling, critical:false },
    { id:"notify", label:"Notification recipient configured", pass:!!form.notificationEmail, critical:false },
    { id:"monitor", label:"Monitoring level specified", pass:!!form.monitoringLevel, critical:false },
    { id:"transform", label:"Transformation requirement clarified", pass:!!form.transformationRequired, critical:false },
    { id:"mapping", label:"Field mapping complexity assessed", pass:!!form.fieldMapping, critical:false },
    { id:"security", label:"No unsupported auth config detected", pass: form.authType !== "None" || form.sourceSystem?.includes("SFTP"), critical:false },
  ];
  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  const warnings = [];
  if (form.authType === "None") warnings.push("No authentication — review security requirements for production use.");
  if (!form.notificationEmail) warnings.push("No notification email — operational alerts will not be delivered.");
  if (!form.monitoringLevel) warnings.push("Monitoring level unset — consider enabling at minimum error-level trace.");
  if (form.fieldMapping === "Unknown – AI suggest") warnings.push("Field mapping complexity unknown — AI will suggest based on system defaults.");

  return { checks, score, warnings };
};

const Step3 = ({ form, onNext }) => {
  const [loading, setLoading] = useState(true);
  const { checks, score, warnings } = validateRequirements(form);
  const critical = checks.filter(c => !c.pass && c.critical);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const scoreColor = score >= 85 ? COLORS.success : score >= 65 ? COLORS.warn : COLORS.error;

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ fontSize:48, marginBottom:16, animation:"spin 1.2s linear infinite" }}>⚙️</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:COLORS.muted, fontSize:14 }}>Running validation checks…</p>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"#1CB35B22", border:"1px solid #1CB35B44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>✅</div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:COLORS.text }}>Requirement Validation</h2>
          <p style={{ margin:0, fontSize:13, color:COLORS.muted }}>AI-assessed completeness and risk analysis</p>
        </div>
      </div>

      {/* Score card */}
      <Card style={{ padding:24, marginBottom:24, display:"flex", alignItems:"center", gap:28 }}>
        <div style={{ textAlign:"center", minWidth:90 }}>
          <div style={{ fontSize:48, fontWeight:800, color:scoreColor, lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:11, color:COLORS.muted, fontWeight:600, letterSpacing:.5, marginTop:4 }}>COMPLETENESS</div>
        </div>
        <div style={{ flex:1 }}>
          <ProgressBar value={score} color={scoreColor} />
          <div style={{ display:"flex", gap:16, marginTop:12 }}>
            <span style={{ fontSize:12, color:COLORS.success }}>✓ {checks.filter(c=>c.pass).length} passed</span>
            <span style={{ fontSize:12, color:COLORS.error }}>✗ {checks.filter(c=>!c.pass && c.critical).length} critical</span>
            <span style={{ fontSize:12, color:COLORS.warn }}>⚠ {warnings.length} warnings</span>
          </div>
          <p style={{ margin:"10px 0 0", fontSize:12, color:COLORS.muted }}>
            {score >= 85 ? "Strong requirement definition. Ready to generate blueprint." : score >= 65 ? "Acceptable. Generating blueprint with some assumptions." : "Several required fields missing. Please review."}
          </p>
        </div>
      </Card>

      {/* Check list */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        {checks.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8,
            background: c.pass ? COLORS.success+"11" : c.critical ? COLORS.error+"11" : COLORS.warn+"11",
            border:`1px solid ${c.pass ? COLORS.success : c.critical ? COLORS.error : COLORS.warn}22` }}>
            <span style={{ fontSize:14 }}>{c.pass ? "✅" : c.critical ? "❌" : "⚠️"}</span>
            <span style={{ fontSize:12, color: c.pass ? COLORS.success : c.critical ? COLORS.error : COLORS.warn, fontWeight:500 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card style={{ padding:16, marginBottom:20, borderColor: COLORS.warn+"44", background: COLORS.warn+"08" }}>
          <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:COLORS.warn, letterSpacing:.5 }}>RECOMMENDATIONS</p>
          {warnings.map((w,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
              <span style={{ color:COLORS.warn, flexShrink:0 }}>→</span>
              <span style={{ fontSize:12, color:COLORS.text }}>{w}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn onClick={onNext} disabled={critical.length > 0}>
          Generate Integration Blueprint →
        </Btn>
      </div>
    </div>
  );
};

// ── Step 4: Blueprint ─────────────────────────────────────────────────────────
const generateBlueprint = (form) => ({
  title: `${form.dataObject} Integration`,
  version: "1.0.0-draft",
  generatedAt: new Date().toLocaleString(),
  sender: {
    system: form.sourceSystem,
    adapter: form.sourceSystem?.includes("SuccessFactors") ? "SuccessFactors Adapter" :
             form.sourceSystem?.includes("ECC") ? "IDOC Adapter" : "REST Adapter",
    authType: form.authType,
    dataFormat: form.dataFormat,
    endpoint: `https://${form.sourceSystem?.toLowerCase().replace(/[^a-z]/g,"")}.api.example.com/v1/data`,
  },
  receiver: {
    system: form.targetSystem,
    adapter: form.targetSystem?.includes("S/4") ? "OData V4 Adapter" :
             form.targetSystem?.includes("MDG") ? "SOAP Adapter" : "REST Adapter",
    authType: "OAuth 2.0",
    endpoint: `https://${form.targetSystem?.toLowerCase().replace(/[^a-z]/g,"")}.api.example.com/v1/receive`,
  },
  trigger: { type: form.frequency?.includes("Event") ? "Event-Driven" : "Timer-Based", schedule: form.frequency },
  processing: [
    { step:1, type:"Content Modifier", purpose:"Set headers and correlation ID", config:"Add custom header X-CorrelationID = ${property.correlationId}" },
    { step:2, type:"Message Mapping", purpose:`Transform ${form.dataFormat} to target format`,
      inputFormat:form.dataFormat, outputFormat: form.targetSystem?.includes("S/4") ? "OData JSON" : "JSON",
      complexity: form.fieldMapping || "Moderate", confidence:87 },
    { step:3, type:"Router", purpose:"Branch on data condition", conditions:["Validation passed → Receiver","Validation failed → Dead Letter"] },
    { step:4, type:"Request Reply", purpose:"Call target system endpoint", timeout:"30s", retries: parseInt(form.retryCount)||3 },
  ],
  errorHandling: {
    strategy: form.errorHandling || "Retry + Notify",
    retries: parseInt(form.retryCount)||3,
    backoff: "Exponential (2s base)",
    notification: { channel:"Email", recipient: form.notificationEmail || "ops@company.com" },
    deadLetterQueue: true,
  },
  monitoring: { level: form.monitoringLevel || "Warning + Error", dashboardEnabled:true, alertingEnabled:!!form.notificationEmail },
  aiConfidenceScore: 91,
});

const Step4 = ({ form, onNext }) => {
  const [loading, setLoading] = useState(true);
  const bp = generateBlueprint(form);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 2200); return () => clearTimeout(t); }, []);

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
      <p style={{ color:COLORS.muted, fontSize:14 }}>Generating Integration Blueprint…</p>
      <div style={{ maxWidth:300, margin:"16px auto 0" }}>
        <ProgressBar value={75} color={COLORS.accent} />
      </div>
    </div>
  );

  const Section = ({ title, icon, children }) => (
    <Card style={{ padding:20, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontSize:13, fontWeight:700, color:COLORS.text, letterSpacing:.3 }}>{title}</span>
        <div style={{ flex:1 }} />
      </div>
      {children}
    </Card>
  );

  const KV = ({ k, v, mono }) => (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${COLORS.border}` }}>
      <span style={{ fontSize:12, color:COLORS.muted }}>{k}</span>
      <span style={{ fontSize:12, color:COLORS.text, fontFamily: mono?"monospace":undefined, maxWidth:"60%", textAlign:"right", wordBreak:"break-all" }}>{v}</span>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"#DB640022", border:"1px solid #DB640044", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📋</div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:COLORS.text }}>{bp.title}</h2>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <Badge color={COLORS.muted}>{bp.version}</Badge>
            <Badge color={COLORS.success}>AI Confidence {bp.aiConfidenceScore}%</Badge>
            <Badge color={COLORS.textDim}>{bp.generatedAt}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:20 }}>
        <Section title="Sender Definition" icon="📤">
          <KV k="System" v={bp.sender.system} />
          <KV k="Adapter" v={bp.sender.adapter} />
          <KV k="Auth" v={bp.sender.authType} />
          <KV k="Format" v={bp.sender.dataFormat} />
          <KV k="Endpoint" v={bp.sender.endpoint} mono />
        </Section>
        <Section title="Receiver Definition" icon="📥">
          <KV k="System" v={bp.receiver.system} />
          <KV k="Adapter" v={bp.receiver.adapter} />
          <KV k="Auth" v={bp.receiver.authType} />
          <KV k="Endpoint" v={bp.receiver.endpoint} mono />
        </Section>
      </div>

      <Section title="Processing Sequence" icon="⚙️">
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {bp.processing.map((p, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 14px",
              background:COLORS.bg, borderRadius:8, border:`1px solid ${COLORS.border}` }}>
              <div style={{ minWidth:28, height:28, borderRadius:6, background:COLORS.accent+"22", color:COLORS.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>
                {p.step}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:COLORS.text }}>{p.type}</span>
                  {p.confidence && <Badge color={COLORS.success}>{p.confidence}% confidence</Badge>}
                </div>
                <p style={{ margin:0, fontSize:12, color:COLORS.muted }}>{p.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Section title="Error Handling" icon="🛡️">
          <KV k="Strategy" v={bp.errorHandling.strategy} />
          <KV k="Retry Count" v={`${bp.errorHandling.retries}x`} />
          <KV k="Backoff" v={bp.errorHandling.backoff} />
          <KV k="Notify" v={bp.errorHandling.notification.recipient} />
          <KV k="Dead Letter Queue" v={bp.errorHandling.deadLetterQueue ? "Enabled" : "Disabled"} />
        </Section>
        <Section title="Monitoring" icon="📊">
          <KV k="Log Level" v={bp.monitoring.level} />
          <KV k="Dashboard" v={bp.monitoring.dashboardEnabled ? "Enabled" : "Disabled"} />
          <KV k="Alerting" v={bp.monitoring.alertingEnabled ? "Active" : "Disabled"} />
          <KV k="Trigger" v={bp.trigger.type} />
          <KV k="Schedule" v={bp.trigger.schedule} />
        </Section>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
        <Btn onClick={() => onNext(bp)}>
          View Visual iFlow →
        </Btn>
      </div>
    </div>
  );
};

// ── Step 5: Visual iFlow ──────────────────────────────────────────────────────
const FLOW_NODES = (bp) => [
  { id:"start", label:"START", type:"start", color:COLORS.nodeStart, icon:"▶", desc:"Integration trigger point", detail:`Trigger: ${bp?.trigger?.type}\nSchedule: ${bp?.trigger?.schedule}` },
  { id:"sender", label:bp?.sender?.adapter || "Sender Adapter", type:"sender", color:COLORS.nodeSender, icon:"📤",
    desc:"Inbound channel adapter", detail:`System: ${bp?.sender?.system}\nAuth: ${bp?.sender?.authType}\nFormat: ${bp?.sender?.dataFormat}` },
  { id:"modifier", label:"Content Modifier", type:"processor", color:COLORS.nodeProcessor, icon:"✏️",
    desc:"Enriches message with metadata", detail:"Sets X-CorrelationID header\nAdds timestamp property\nInjects source system tag", confidence:95 },
  { id:"mapping", label:"Message Mapping", type:"mapper", color:COLORS.nodeMapper, icon:"🗺️",
    desc:`Transform ${bp?.sender?.dataFormat} → Target Format`,
    detail:`Input: ${bp?.sender?.dataFormat}\nOutput: OData JSON\nComplexity: ${bp?.processing?.[1]?.complexity || "Moderate"}`,
    confidence: bp?.processing?.[1]?.confidence || 87 },
  { id:"router", label:"Router", type:"router", color:COLORS.nodeRouter, icon:"⑂",
    desc:"Conditional routing based on validation", detail:"Route 1: Validation OK → Receiver\nRoute 2: Validation Fail → Dead Letter\nRoute 3: Duplicate → Discard", confidence:90 },
  { id:"reqreply", label:"Request Reply", type:"reqreply", color:COLORS.nodeReqReply, icon:"⇄",
    desc:"Synchronous call to target system",
    detail:`Endpoint: ${bp?.receiver?.endpoint || ""}\nTimeout: 30s\nRetries: ${bp?.errorHandling?.retries || 3}x`, confidence:93 },
  { id:"receiver", label:bp?.receiver?.adapter || "Receiver Adapter", type:"receiver", color:COLORS.nodeReceiver, icon:"📥",
    desc:"Outbound channel adapter", detail:`System: ${bp?.receiver?.system}\nAuth: ${bp?.receiver?.authType}` },
  { id:"end", label:"END", type:"end", color:COLORS.nodeEnd, icon:"⏹", desc:"Integration complete", detail:"Success → Message logged\nFailed → Alert sent" },
];

const FlowNode = ({ node, onClick, selected }) => (
  <div
    onClick={() => onClick(node)}
    style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:0,
      cursor:"pointer", userSelect:"none",
    }}
  >
    <div style={{
      width:160, padding:"12px 16px", borderRadius:12, textAlign:"center",
      background: selected ? node.color+"33" : COLORS.surface,
      border:`2px solid ${selected ? node.color : node.color+"55"}`,
      boxShadow: selected ? `0 0 0 3px ${node.color}33, 0 4px 20px #00000030` : `0 2px 8px #00000030`,
      transition:"all .2s",
    }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{node.icon}</div>
      <div style={{ fontSize:11, fontWeight:700, color:node.color, letterSpacing:.4, lineHeight:1.3 }}>{node.label}</div>
      <div style={{ fontSize:10, color:COLORS.textDim, marginTop:3, lineHeight:1.4 }}>{node.desc}</div>
    </div>
  </div>
);

const Arrow = ({ dashed }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", height:36 }}>
    <div style={{ width:2, flex:1, borderLeft:`2px ${dashed?"dashed":"solid"} ${COLORS.border}` }} />
    <span style={{ color:COLORS.muted, fontSize:14 }}>▼</span>
  </div>
);

const NodeDetail = ({ node, onClose }) => (
  <Card style={{ padding:24, border:`1px solid ${node.color}55` }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:node.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
          {node.icon}
        </div>
        <div>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:node.color }}>{node.label}</h3>
          <p style={{ margin:0, fontSize:12, color:COLORS.muted }}>{node.desc}</p>
        </div>
      </div>
      <button onClick={onClose} style={{ background:"none", border:"none", color:COLORS.muted, cursor:"pointer", fontSize:18, padding:4 }}>✕</button>
    </div>

    <div style={{ background:COLORS.bg, borderRadius:8, padding:16, marginBottom:16, fontFamily:"monospace", fontSize:12, color:COLORS.text, lineHeight:1.8, whiteSpace:"pre-line", border:`1px solid ${COLORS.border}` }}>
      {node.detail}
    </div>

    {node.confidence && (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:12, color:COLORS.muted, fontWeight:600 }}>AI Confidence Score</span>
          <span style={{ fontSize:12, color: node.confidence >= 90 ? COLORS.success : COLORS.warn, fontWeight:700 }}>{node.confidence}%</span>
        </div>
        <ProgressBar value={node.confidence} color={node.confidence >= 90 ? COLORS.success : COLORS.warn} />
        <p style={{ margin:"10px 0 0", fontSize:11, color:COLORS.textDim }}>
          {node.confidence >= 90 ? "High confidence — AI recommendation well-supported by provided requirements." : "Moderate confidence — review and confirm field mapping details before implementation."}
        </p>
      </div>
    )}

    <div style={{ marginTop:16, padding:12, background:COLORS.accentGlow, borderRadius:8, border:`1px solid ${COLORS.accent}33` }}>
      <p style={{ margin:0, fontSize:11, color:COLORS.accent }}>
        💡 <strong>SAP Integration Suite:</strong> This component maps to <em>{
          node.type === "sender" ? "Sender Channel configuration in iFlow" :
          node.type === "mapper" ? "Message Mapping artifact (.mmap)" :
          node.type === "router" ? "Router step with condition expressions" :
          node.type === "reqreply" ? "Request-Reply step with HTTP Receiver" :
          node.type === "processor" ? "Content Modifier step" :
          node.type === "receiver" ? "Receiver Channel configuration" :
          "Integration Process trigger"
        }</em>
      </p>
    </div>
  </Card>
);

const Step5 = ({ blueprint }) => {
  const [selected, setSelected] = useState(null);
  const nodes = FLOW_NODES(blueprint);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"#0891B222", border:"1px solid #0891B244", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔀</div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:COLORS.text }}>Visual iFlow — {blueprint?.title}</h2>
          <p style={{ margin:0, fontSize:13, color:COLORS.muted }}>Click any node to inspect AI-generated configuration</p>
        </div>
        <Badge color={COLORS.success}>Draft</Badge>
      </div>

      <div style={{ display:"flex", gap:24 }}>
        {/* Flow canvas */}
        <div style={{ flex:"0 0 220px", display:"flex", flexDirection:"column", alignItems:"center" }}>
          <Card style={{ padding:16, width:"100%", background:`${COLORS.surface}cc` }}>
            <p style={{ margin:"0 0 12px", fontSize:10, fontWeight:700, color:COLORS.muted, letterSpacing:.8 }}>INTEGRATION FLOW</p>
            {nodes.map((n, i) => (
              <div key={n.id}>
                <FlowNode node={n} onClick={setSelected} selected={selected?.id === n.id} />
                {i < nodes.length - 1 && <Arrow dashed={n.id === "router"} />}
              </div>
            ))}
          </Card>
        </div>

        {/* Detail panel */}
        <div style={{ flex:1 }}>
          {selected ? (
            <NodeDetail node={selected} onClose={() => setSelected(null)} />
          ) : (
            <Card style={{ padding:32, height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", border:`1px dashed ${COLORS.border}` }}>
              <div style={{ fontSize:48, marginBottom:16 }}>👆</div>
              <h3 style={{ margin:"0 0 8px", color:COLORS.text, fontSize:16 }}>Select a node to inspect</h3>
              <p style={{ margin:0, color:COLORS.muted, fontSize:13 }}>Click any step in the flow to view its AI-generated configuration, confidence score, and SAP Integration Suite mapping</p>
              <div style={{ marginTop:24, display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                {nodes.map(n => (
                  <Btn key={n.id} variant="ghost" style={{ padding:"6px 12px", fontSize:11 }} onClick={() => setSelected(n)}>
                    {n.icon} {n.label}
                  </Btn>
                ))}
              </div>
            </Card>
          )}

          {/* Summary cards */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:16 }}>
            {[
              { label:"Total Steps", value:nodes.length, icon:"🔢", color:COLORS.accent },
              { label:"Avg Confidence", value:`${Math.round(nodes.filter(n=>n.confidence).reduce((a,n)=>a+n.confidence,0)/nodes.filter(n=>n.confidence).length)}%`, icon:"🎯", color:COLORS.success },
              { label:"Status", value:"Draft", icon:"📄", color:COLORS.warn },
            ].map(c => (
              <Card key={c.label} style={{ padding:16, textAlign:"center" }}>
                <div style={{ fontSize:22 }}>{c.icon}</div>
                <div style={{ fontSize:20, fontWeight:800, color:c.color, margin:"4px 0" }}>{c.value}</div>
                <div style={{ fontSize:11, color:COLORS.muted }}>{c.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card style={{ marginTop:20, padding:16, background:COLORS.success+"0A", borderColor:COLORS.success+"33" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:24 }}>🎉</span>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:COLORS.success }}>Integration Blueprint Complete</p>
            <p style={{ margin:"4px 0 0", fontSize:12, color:COLORS.muted }}>
              This design is ready for review. Hand off to your SAP BTP developer with the Blueprint JSON for implementation in SAP Integration Suite.
              Use SAP Business Application Studio to scaffold the iFlow package from this specification.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ── App shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState("");
  const [formData, setFormData] = useState({});
  const [blueprint, setBlueprint] = useState(null);

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:COLORS.text }}>
      {/* Header */}
      <div style={{ borderBottom:`1px solid ${COLORS.border}`, background:COLORS.surface, padding:"16px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:20, minHeight:90 }}>
          <div style={{ flexShrink:0, padding:8, borderRadius:16, background:"rgba(255,255,255,0.04)", boxShadow:"0 8px 24px rgba(0,0,0,0.08)" }}>
            <img
              src="https://cdn-dppbb.nitrocdn.com/RyaJIqOPsPMsUbkNfQxAzGEZqYiXmvTP/assets/images/optimized/rev-6bfce2c/www.appseconnect.com/wp-content/uploads/2021/03/SAP-Cloud-Platform-Integration-Suite-1024x415.jpg"
              alt="App logo"
              style={{ width:260, maxWidth:"100%", height:"auto", borderRadius:14 }}
            />
          </div>
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontWeight:800, fontSize:18, letterSpacing:1, color:COLORS.text }}>FLOW</span>
              <span style={{ fontWeight:800, fontSize:18, letterSpacing:1, color:COLORS.accent }}>DESIGNER</span>
            </div>
            <span style={{ fontSize:16, fontWeight:700, color:COLORS.text, maxWidth:760, lineHeight:1.35 }}>AI-Powered Integration Composer for SAP Integration Suite</span>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <Badge color={COLORS.accent}>SAP BTP</Badge>
              <Badge color="#7C3AED">Joule AI</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 32px" }}>
        <StepBar current={step} />
        <Card style={{ padding:36 }}>
          {step === 1 && <Step1 onNext={(text) => { setRawText(text); setStep(2); }} />}
          {step === 2 && <Step2 rawText={rawText} onNext={(form) => { setFormData(form); setStep(3); }} />}
          {step === 3 && <Step3 form={formData} onNext={() => setStep(4)} />}
          {step === 4 && <Step4 form={formData} onNext={(bp) => { setBlueprint(bp); setStep(5); }} />}
          {step === 5 && <Step5 blueprint={blueprint} />}
        </Card>

        {/* Bottom nav */}
        {step > 1 && (
          <div style={{ marginTop:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Btn>
            {step === 5 && (
              <Btn variant="ghost" onClick={() => { setStep(1); setRawText(""); setFormData({}); setBlueprint(null); }}>
                ↺ New Integration
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
