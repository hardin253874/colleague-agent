# Work Skill Analyzer Prompt

## Task

You will receive source material for **{name}** (docs, messages, emails, etc.).
Extract their working capability and methods, to be used for building the Work Skill.

**Principle: extract work-related content only, ignore chit-chat. Don't infer — only write what the source material supports. Mark anything unsupported as "insufficient source material".**

---

## Universal Extraction Dimensions (all roles)

### 1. Scope of Responsibility

From the source material, identify:
- Systems / modules / business lines / products they own
- Docs they maintain (API docs, wiki, runbooks, etc.)
- Their responsibility boundary (what's theirs, what isn't)
- Project codenames and business terms they mention frequently

```
Output format:
Domain:       [description]
Core systems: [list]
Maintained docs: [list]
Boundary:     [what they own / what they don't]
```

### 2. Workflow

From task descriptions and meeting notes:
- How they handle an incoming task
- How they structure specs/docs
- How they manage progress and deadlines
- How they handle exceptions / emergencies

```
Output format:
Incoming task:    [steps]
Writing a spec:   [structure]
Exception handling: [process]
```

### 3. Output Format Preferences

- Tables / lists / flowcharts / plain prose
- Conclusion-first or narrative
- Document detail level (minimal / balanced / exhaustive)
- Reply / email style

```
Output format:
Doc style:       [description]
Detail level:    [minimal / balanced / exhaustive]
```

### 4. Experience Knowledge Base

Judgments they explicitly stated, pitfalls they've hit, technical opinions (quote verbatim when possible):

```
- "[quote or summary]"
- "[quote or summary]"
```

---

## Role-specific Extraction

Based on {name}'s role, focus on the corresponding dimensions:

---

### 🖥️ Backend / Server Engineer

**Technical standards**:
- Tech stack (language, framework, middleware)
- Naming conventions (API path style, variable / function naming)
- API design (response shape, error codes, pagination, idempotency)
- Database preferences (ORM vs raw SQL, transaction boundaries)
- Exception-handling style

**Code Review focus**:
- CR issues they raise repeatedly (N+1, transactions, concurrency safety, etc.)
- CR comment style (direct / tactful, [block]/[suggest] severity levels, etc.)

**Deployment and ops**:
- Monitoring signals they care about
- How they triage production issues
- Release / change-management process

---

### 🌐 Frontend Engineer

**Technical standards**:
- Tech stack (framework, state management, styling approach)
- Component decomposition principles (when to split, when not to)
- Performance focus (first paint, lazy loading, bundle size, etc.)
- API calling and error-handling patterns

**Engineering practice**:
- Code-quality tooling (ESLint rule preferences, Prettier config)
- Test coverage expectations (attitude toward unit / integration tests)
- CR focus (accessibility / responsiveness / compatibility)

---

### 🤖 ML / Algorithm Engineer

**Research and experiments**:
- How they frame the problem (breaking down an ML problem)
- Experiment design habits (baseline choice, ablation design)
- Metric preferences (offline vs online metric attitude)
- Models / methodologies they reach for

**Engineering productionization**:
- Preferred training framework
- Model deployment process
- Data-processing standards

**Docs and conclusions**:
- Experiment report style (outcome-heavy vs process-heavy)
- Papers or methodologies they cite

---

### 📱 Product Manager / Technical PM

**Requirements handling**:
- PRD structure and level of detail
- How they define user stories / scope
- How they align with engineering (review format, change process)

**Decision framework**:
- Prioritization method (RICE / MoSCoW / custom)
- Data-driven vs intuition ratio
- How they handle requirement conflicts

**Deliverables**:
- Doc types they produce (PRD / MRD / prototypes / competitive analysis)
- Prototyping tool preference
- Involvement in analytics / instrumentation

---

### 🎨 Designer

**Design standards**:
- Design system / component library used
- Annotation and handoff format
- Tolerance for pixel-perfection

**Workflow**:
- Steps from requirement to proposal
- Walkthrough / QA process
- How they handle dev-side fidelity issues

---

### 📊 Data Analyst

**Analysis methods**:
- Common frameworks (funnel / cohort / A-B testing, etc.)
- SQL style (concise / heavily commented)
- Visualization preferences (chart-type choices)

**Reporting style**:
- Conclusions vs data ratio
- How strictly they apply "let data speak"
- How they handle data anomalies or definition disputes

---

## Output Requirements

- Language: English
- Dimensions with no info: mark as `(insufficient source material — suggest appending related docs)`
- Conclusions with textual evidence: include the quoted original phrase
- The output feeds directly into work.md — be concrete and actionable. Don't hedge with "possibly" or "tends to".
