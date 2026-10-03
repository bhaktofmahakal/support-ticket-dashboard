**Technical Assignment** 

Support Ticket Dashboard | Full-stack Web Application Developer | 4-6 hours 

**Problem statement** 

A small company currently manages customer support requests through spreadsheets. Build a web application that allows its support team to create tickets, track their status, and quickly find requests that need attention. 

The application should include a frontend, a backend API, and persistent data storage. **Required functionality**   
**1\. Create a support ticket** 

Each ticket should contain: 

• **Title:** required, maximum 120 characters. 

• **Description:** required. 

• **Customer email:** required, valid email format. 

• **Priority:** Low, Medium, or High. 

• **Status:** Open, In Progress, or Resolved; defaults to Open. 

• **Created and updated timestamps:** generated automatically. 

Validate inputs on both the frontend and backend, and display useful error messages. 

**2\. View and find tickets** 

Build a ticket listing page that supports: 

• Searching by title or customer email. 

• Filtering by status and priority. 

• Sorting by creation date, newest or oldest first. 

• Pagination with 10 tickets per page. 

Search and filters should work together. Filtering, sorting, and pagination must be handled by the backend. 

**3\. View and update a ticket** 

Users should be able to open a ticket, view its complete details, and update its status and priority. Changes must persist after refreshing the page. 

**4\. Show summary counts** 

Display the total number of tickets and the counts for Open, In Progress, and Resolved tickets. These counts should reflect the entire dataset, regardless of active filters.

WEB APPLICATION DEVELOPER | TECHNICAL ASSIGNMENT 1   
**Technical expectations** 

• Use a frontend framework, backend framework, and database of your choice. 

• Build a responsive interface suitable for desktop and mobile. 

• Include loading, empty, and error states. 

• Use meaningful HTTP status codes and consistent API error responses. 

• Organize the code so another developer can understand and extend it. 

• Include at least three meaningful automated tests covering validation, querying, or ticket updates. • Provide seed data containing at least 25 tickets with varied statuses and priorities. Authentication, deployment, and advanced visual design are outside the required scope. 

**Submission** 

Share a Git repository containing: 

• Application source code. 

• Database setup or migrations and seed instructions. 

• A README with setup steps, required environment variables, and instructions to run tests. • A brief explanation of your technical choices, assumptions, known limitations, and time spent. • Screenshots or a short demonstration video. 

The application should run locally using the documented instructions. 

**Time limit** 

Spend no more than **6 hours** on the assignment. If you cannot complete everything, submit your progress and explain what remains. We value clear prioritization and honest tradeoffs. 

AI tools are permitted. Briefly describe how you used them, and be prepared to explain and modify all submitted code. 

**Evaluation criteria** 

**Area Weight** Functional correctness and data persistence 30% Code structure and maintainability 25% API design, validation, and error handling 20% Usability and responsive behavior 15% Tests and setup documentation 10% 

During the follow-up interview, we will discuss your implementation and ask you to make a small change to the application.

WEB APPLICATION DEVELOPER | TECHNICAL ASSIGNMENT 2 