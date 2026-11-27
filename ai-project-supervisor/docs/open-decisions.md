# Open decisions to confirm with the supervisor (S0-12)

Source: System Design Document, Appendix A. Each item has the design's current position, so the supervisor can simply confirm it or choose another option. Answers can change tasks in Sprints 5, 9, 15 and 16.

## 1. Supervisor assignment

The SRS says supervisors monitor assigned projects but does not say how a supervisor is assigned.

- Option A: the student selects or requests a supervisor when creating the project.
- Option B: a Sub Admin assigns the supervisor.

The design stores `supervisorId` on the project either way. Which option should the platform use?

Answer:

## 2. Deadline changes

SRS 2.2.3 says Team Leaders modify deadlines. SRS 3.2.2 says they propose deadline changes.

Design position: the Team Leader starts and applies a change, which is recorded in task history and visible to the supervisor. Should a deadline change need supervisor approval before it takes effect?

Answer:

## 3. Public certificate verification

Users can verify a certificate by ID, and SRS 2.2.5 requires that verification does not need access to the private workspace. The role matrix lists only human roles.

Should the platform add a public verification page that needs no login (useful for employers and institutions)?

Answer:

## 4. Who issues certificates

The RBAC matrix gives Sub Admin full access to generate certificates. SRS 3.2.6 says Sub Admins manage certificate records. Students, leaders and members cannot issue certificates.

Design position: the system issues certificates automatically when all conditions are met, and Sub Admins manage records and may re-issue or revoke according to policy. Is this reading correct? Should a supervisor also have to approve before issue (the `supervisorApprovalRequired` setting)?

Answer:

## Also worth confirming

- Team size and member skills are planning inputs, but SRS lists timeline planning before team formation. Should team formation start first, or should team size be entered provisionally?
- Registration creates Students; the Super Admin assigns Supervisor and Sub Admin roles; the first Super Admin is created at installation. Is this acceptable?
