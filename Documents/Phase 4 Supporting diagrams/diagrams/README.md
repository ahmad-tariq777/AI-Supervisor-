# AI Project Supervisor (Module 1) - UML and Architecture Diagrams

38 diagrams in PNG (png/), SVG (svg/) and editable PlantUML source (src/).
Sources used: SRS parts 02 and 03, Proposal, Project Idea, Technology Stack, System Design Document (parts 04 to 06 and Appendix A).

To re-render: install Java and Graphviz, download plantuml.jar into this folder, run render.sh. Shared styling is in src/style.iuml.

## 1. Diagram index

Use case (8)
- 01 UC-0 Overview of all roles and capability groups
- 02 UC-1 Idea discovery
- 03 UC-2 Analysis and planning
- 04 UC-3 Team formation
- 05 UC-4 Execution plan
- 06 UC-5 Monitoring and verification
- 07 UC-6 Completion and certification
- 08 UC-7 Administration (Super Admin, Sub Admin)

Activity with swimlanes (11)
- 10 Idea discovery (WF-03/04/05)
- 11 Requirements, methodology, timeline (WF-06/07)
- 12 Team formation (WF-08)
- 13 Plan generation and assignment (WF-09/10)
- 14 Submission, verification, supervisor review (WF-11/14/15/16/17)
- 15 Progress monitoring (WF-12)
- 16 Blockers (WF-13)
- 17 Completion and certificate generation (WF-19/20)
- 18 Certificate verification (WF-21)
- 19 Role management and Sub Admin promotion (WF-22/23)
- 20 AI configuration (WF-26)

ER / MongoDB (5): 30 overview of all 27 collections, 31 users/projects/teams/discovery/planning, 32 execution/monitoring, 33 evidence/verification/certification, 34 AI and administration. Embedded documents are shown as separate boxes marked embedded and joined by dashed lines; references are FK fields.

Sequence (12): 40 register/login, 41 idea research (async job), 42 requirements baseline, 43 team invitations, 44 plan generation and assignment, 45 submission and AI verification, 46 supervisor override, 47 monitoring, 48 completion and certificates, 49 certificate verification, 50 Sub Admin promotion/demotion, 51 AI configuration.

Architecture (2): 60 layered architecture, 61 single-server deployment.

## 2. Component inventory (summary)

Actors: Student, Team Leader (specialization of Student), Team Member, Supervisor, Super Admin, Sub Admin, AI Supervisor (system actor); external: GitHub, research sources.
Components: React SPA, Nginx, Express API (middleware + modules, aiGateway, github, scheduler), Python AI service, RAG pipeline, Scikit-learn models M1-M5, Ollama (Llama 3.2 3B), MongoDB (27 collections), vector store, file storage.

## 3. Validation performed

- All 38 sources compile with PlantUML 1.2025.4 without errors.
- A script confirmed that all 27 collections of the design document appear in ER-0 and that the sequence diagrams only write to those collections.
- Status names, priorities, verification statuses and invitation states use the exact SRS/design wording.
- Authorization points in the sequence diagrams (Super Admin only for promotion, assignee-only status update, Team Leader-only assignment, supervisor reason required for override) follow the RBAC rules.
- I visually inspected UC-0, AD-5, ER-1 and AR-1. The others compile cleanly but were not each inspected line by line, so please check layout before submission.
- This is a consistency check against the documents, not a proof that the diagrams are error-free.

## 4. Open points (SRS gaps or contradictions) and how each diagram treats them

1. Who assigns a Supervisor to a project is undefined. Diagrams show only projects.supervisorId and no assignment use case.
2. Certificate generation: the RBAC matrix gives Sub Admin "Full" but section 3.2.6 says Sub Admins manage records. Diagrams show the AI/system generating certificates when conditions are met, the Supervisor authorizing where enabled, and Sub Admin managing records.
3. Public certificate verification (without login) is not decided. Diagrams show verification by all human roles only; no anonymous actor.
4. Team Member and idea discovery: the matrix says Full for discovering and submitting ideas, section 3.2.3 lists neither. Diagrams follow 3.2.3 (excluded).
5. Deadline changes: Team Leader "modifies" (2.2.3) versus "proposes" (3.2.2). Diagrams show the Team Leader applying changes without supervisor approval.
6. How Sub Admin Ollama/RAG settings reach the Python service (stored in aiConfigurations versus environment variables) is not specified. SD-12 shows only the health check and storage.
7. The matrix gives Sub Admin access to review verification reports and limited team creation; neither appears in section 3.2.6, so they are not drawn.
8. Stage names and the invitation state "pending" are design terms from the System Design Document, not SRS wording.
