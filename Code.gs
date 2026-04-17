/**
* Main Function: Consolidates AI/ML Release Notes and Blogs.
* This version is verified to capture actual article titles and 15-day history.
*/
function sendUnifiedAIandMLDigest() {
 const projectId = 'projectid;
 const customerEmails = ['LDAP@gmail.com'].join(',');
 const bccEmails = ['LDAP@gmail.com', 'LDAP@gmail.com'].join(',');
  const lookbackDays = 15;
 console.log("--- DEBUG: STARTING FINAL VALIDATED SCRAPE (Lookback: 15 Days) ---");


 // 1. Fetch Release Notes (Vertex AI/Gemini)
 const aiRows = fetchReleaseNotes(projectId, lookbackDays, ['Vertex AI', 'Gemini']);
  // 2. Fetch AI Blogs (Using API with robust title/date detection)
 let aiPosts = scrapeAICloudBlogAPI(lookbackDays);
  if (aiRows.length === 0 && aiPosts.length === 0) {
   console.log("--- VALIDATION: No new updates found. ---");
   return;
 }


 const subject = "Google Cloud AI & ML Digest: Gemini & Vertex (Last 15 Days)";
  let htmlBody = `
   <div style="font-family: 'Google Sans', sans-serif; color: #3c4043; max-width: 800px; line-height: 1.5;">
     <h2 style="color: #1a73e8; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 25px;">
       Google Cloud: Unified AI & Machine Learning Digest
     </h2>
     <p>Hi Team,</p>
     <p>Here are the consolidated latest updates for <b>Gemini, Vertex AI, and Machine Learning</b> from the last ${lookbackDays} days:</p>
 `;


 // --- SECTION: GOOGLE RELEASE NOTES ---
 if (aiRows.length > 0) {
   htmlBody += `<div style="margin-top:40px;"><h2 style="background-color:#1a73e8; color:#ffffff; padding:12px; border-radius:4px; font-size:18px; margin:0;">GOOGLE RELEASE NOTES (AI & ML)</h2><div style="padding:15px; border:1px solid #1a73e8; border-top:none; border-radius:0 0 4px 4px;">`;
   let currentProduct = '';
   aiRows.forEach(function(row) {
     let product = row.f[0].v; let date = row.f[1].v; let type = row.f[2].v; let desc = formatLinks(row.f[3].v);
     if (product !== currentProduct) { htmlBody += `<h3 style="color:#1a73e8; margin-top:25px; font-size:16px; text-transform:uppercase;">${product}</h3>`; currentProduct = product; }
     htmlBody += `<div style="margin-bottom:20px; padding-left:12px; border-left:3px solid #ea4335;"><div style="display:flex; align-items:center; margin-bottom:5px;"><span style="font-weight:bold; font-size:13px; color:#70757a; margin-right:15px;">${date}</span><span style="${getTagStyle(type)}">${type}</span></div><p style="margin-top:8px; font-size:14px;">${desc}</p></div>`;
   });
   htmlBody += `</div></div>`;
 }


 // --- SECTION: PRODUCT BLOGS ---
 if (aiPosts.length > 0) {
   htmlBody += `<div style="margin-top:40px;"><h2 style="background-color:#0F9D58; color:#ffffff; padding:12px; border-radius:4px; font-size:18px; margin:0;">GOOGLE CLOUD BLOG (AI & ML)</h2><div style="padding:15px; border:1px solid #0F9D58; border-top:none; border-radius:0 0 4px 4px;"><ul style="list-style-type:none; padding-left:0; margin:0;">`;
   aiPosts.forEach(function(post) {
     htmlBody += `<li style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px dashed #f1f3f4;"><a href="${post.link}" style="text-decoration:none; font-size:15px; color:#1a73e8; font-weight:bold;">${post.title}</a><div style="font-size:12px; color:#70757a; margin-top:4px;">Published: ${post.date}</div></li>`;
   });
   htmlBody += `</ul></div></div>`;
 }


 htmlBody += `<div style="font-size:14px; color:#3c4043; border-top:1px solid #e0e0e0; padding-top:20px; margin-top: 40px;">Best regards,<br><br><strong>Rajesh Daruvuri</strong><br>TAM, US Retail | Google Cloud Consulting</div></div>`;


 try {
   MailApp.sendEmail({ to: customerEmails, bcc: bccEmails, subject: subject, htmlBody: htmlBody });
   console.log(`--- SUCCESS: Sent digest with ${aiPosts.length} total AI articles. ---`);
 } catch (e) { console.error(`Email Error: ${e.toString()}`); }
}


/**
* Validated API Scraper: Uses multiple field fallbacks for robust title and date detection.
*/
function scrapeAICloudBlogAPI(days) {
 const cutoffDate = new Date(); cutoffDate.setHours(0,0,0,0); cutoffDate.setDate(cutoffDate.getDate() - days);
 const apiUrl = "https://gweb-cloudblog-publish.appspot.com/api/v2/latest/?tags=ai-machine-learning&paginate=50";
 const posts = [];
 const seenLinks = new Set();
  try {
   const response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
   let responseText = response.getContentText();
  
   // FIX 1: Strip the XSSI security prefix ")]}'\n"
   if (responseText.indexOf(")]}'") === 0) {
     responseText = responseText.substring(responseText.indexOf("\n") + 1);
   }
  
   const data = JSON.parse(responseText);
   const items = data.results || data.items || [];
   console.log("--- DEBUG: API returned " + items.length + " raw articles ---");


   items.forEach(function(item, index) {
     // FIX 2: Check all possible title and date fields based on Wagtail schema
     const titleRaw = item.title || (item.meta && item.meta.title) || item.headline || "Untitled";
     const dateRaw = item.published || item.published_at || item.publish_date || (item.meta && item.meta.first_published_at);
     const link = (item.url && item.url.indexOf('http') === 0 ? item.url : 'https://cloud.google.com' + (item.url || "")).split('?')[0];


     // Rhino-safe date parsing
     const pubDate = dateRaw ? new Date(dateRaw.toString().replace(/-/g, "/").replace("T", " ").replace("Z", "")) : new Date(0);


     if (pubDate >= cutoffDate && !seenLinks.has(link) && item.url) {
       // CLEANING: Strip AI prefix and author names
       let title = titleRaw.replace(/^(AI & Machine Learning|AI and Machine Learning):?\s*/i, '')
                             .replace(/\s*By\s+.*$/i, '')
                             .trim();
                          
       posts.push({ source: 'GOOGLE CLOUD BLOG', category: 'AI & MACHINE LEARNING', title: title, link: link, date: pubDate.toDateString() });
       seenLinks.add(link);
       console.log(`[MATCH] Included: ${title} (${pubDate.toDateString()})`);
     }
   });
 } catch (e) { console.error("API Error: " + e.toString()); }
 return posts;
}


/**
* Helpers
*/
function fetchReleaseNotes(projectId, days, productList) {
 const products = productList.map(function(p) { return "'" + p + "'"; }).join(',');
 const query = "SELECT product_name, DATE(published_at) as release_date, release_note_type, description FROM `bigquery-public-data.google_cloud_release_notes.release_notes` WHERE (product_name IN (" + products + ") OR product_name LIKE '%Vertex AI%') AND published_at >= DATE_SUB(CURRENT_DATE(), INTERVAL " + days + " DAY) AND LOWER(description) NOT LIKE '%weekly digest%' AND release_note_type not in ('FIX','OTHER') ORDER BY product_name ASC, published_at DESC";
 try { return BigQuery.Jobs.query({ query: query, useLegacySql: false }, projectId).rows || []; } catch (e) { return []; }
}
function getTagStyle(type) {
 let bg = '#e6f4ea'; let txt = '#137333'; const ut = (type || '').trim().toUpperCase();
 if (ut !== 'FEATURE') { bg = '#fef7e0'; txt = '#b06000'; }
 if (ut === 'DEPRECATION') { bg = '#fce8e6'; txt = '#c5221f'; }
 return "background-color:" + bg + "; color:" + txt + "; padding:2px 10px; border-radius:12px; font-size:10px; font-weight:bold; text-transform:uppercase;";
}
function formatLinks(text) { return (text || '').replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#1a73e8;text-decoration:none;font-weight:bold;">$1</a>'); }





