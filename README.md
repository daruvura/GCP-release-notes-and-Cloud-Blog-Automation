# GCP-release-notes-and-Cloud-Blog-Automation
Google Cloud release notes and Cloud Blog Automation

The Challenge:
Manually curating and sending relevant Google Cloud release notes (Features, Deprecations, Changes) to our customers is time-consuming and often hard to track across specific products.

The Solution:
I built a lightweight, serverless automation agent using Google Apps Script that queries the official BigQuery Public Dataset for Release Notes (bigquery-public-data.google_cloud_release_notes.release_notes). It automatically generates and emails a beautifully formatted digest to my retail customers on a scheduled basis.

Key Features of the Agent:

Targeted Product Filtering: Queries are customized per customer to only pull updates for the products they care about (e.g., dedicated digests for GKE & Compute, Cloud Storage, SecOps, or Vertex AI & Gemini).

Smart UI & Formatting: The email is generated in HTML, automatically grouping updates by Product Name, and sorting them by date. It also uses a regex parser to convert raw Markdown links into clickable HTML links.

Color-Coded Triage: Release note types are visually highlighted using Google-style UI tags so customers can skim easily:

🟢 Green: FEATURE

🔴 Red: DEPRECATION

🟡 Amber: Everything else (ENHANCEMENT, CHANGE, etc.)

Enterprise Ready: Supports bulk mailing (multiple TO and BCC addresses), auto-appends a professional TAM email signature, and filters out system "noise" (like weekly digest summaries or client library bumps).

Zero-Maintenance: Runs on a scheduled Apps Script trigger (e.g., bi-weekly or monthly) requiring zero manual intervention once configured.

The Impact:
This ensures our customers are proactively informed about critical updates and upcoming deprecations for their specific tech stack, driving better adoption of new features (like Gemini) while saving hours of manual curation time each month.

Steps: How to Build Your Automation Agent

We can use Google Apps Script (which runs directly in your Google Workspace account for free) to automate this entirely.

Here are the steps to set up your agent:

Step 1: Open Apps Script and Enable the BigQuery API

Go to script.google.com and click New Project.

On the left sidebar, click on Services (the + icon).

Scroll down, select BigQuery API, and click Add.

Step 2: Add the Agent Code

Replace the default code in Code.gs with the following script. This script queries the public dataset for exactly the filters from your Pantheon URL (Gemini and VertexAI), formats the HTML, and sends the email.

Refer <Code.gs>


Step 3: Automate it (The 15-Day Trigger)

To make it an autonomous agent that runs every 15 days:

In your Apps Script editor, click the Triggers icon (the alarm clock ⏰) on the left sidebar.

Click + Add Trigger in the bottom right corner.

Choose sendVertexMonthlyReleaseNotes for the function to run.

Under Select event source, choose Time-driven.

Under Select type of time based trigger, choose Day timer or Week timer (e.g., set it to run on the 1st and 15th of the month by creating two separate monthly triggers, or just use a standard week/day interval).

Save the trigger.

