const WEB = {
  SaaS: ['Analytics Dashboard','User Management Admin','API Docs Portal','Status Page Monitor','Feature Flag Manager','Email Campaign Manager','Subscription Billing Dashboard','Support Ticket System','Webhook Manager','Error Tracking Dashboard','A/B Testing Dashboard','Onboarding Flow Builder','Changelog Manager','Customer Feedback Portal','NPS Survey Tool','Knowledge Base App','Team Wiki','Audit Log Viewer','OAuth App Manager','Multi-tenant Admin'],
  CRM: ['Sales Pipeline Dashboard','Contact Manager App','Invoice Generator App','Client Portal App','Proposal Builder App','Expense Tracker App','Lead Scoring Dashboard','Deal Room App','Meeting Scheduler App','Sales Forecasting Tool','Commission Tracker','Territory Mapping Tool','Account Planning App','Competitor Battlecard App','Quote Configurator'],
  Ecommerce: ['Online Store App','Order Management Dashboard','Inventory Tracker App','Product Catalog App','Coupon Manager App','Shipping Calculator','Returns Portal','Vendor Marketplace','Wholesale Ordering App','Subscription Box Manager','Price Comparison App','Digital Downloads Store','Gift Card System','Loyalty Points Dashboard','Supplier Management App'],
  Healthcare: ['Patient Portal App','Appointment Booking System','Hospital Admin Dashboard','Telemedicine Platform App','Fitness Health Tracker','Mental Health Journal','Medication Tracker App','Lab Results Viewer','Diet Nutrition Planner','Physical Therapy Tracker'],
  Education: ['Learning Management System','Student Dashboard App','Quiz Assessment Builder','Classroom Manager App','Report Card Generator','Library Catalog App','Study Planner App','Flashcard Study App','Grade Book App','Assignment Tracker App'],
  Finance: ['Banking Dashboard App','Budget Planner App','Investment Portfolio Tracker','Stock Watchlist App','Tax Calculator App','Loan Amortization Calculator','Crypto Portfolio Tracker','Personal Finance Tracker','Profit Loss Report','Cash Flow Forecaster'],
  Marketing: ['Social Media Scheduler','Content Calendar App','SEO Audit Dashboard','Keyword Tracker App','UTM Link Builder','Landing Page Builder App','Influencer CRM App','Brand Asset Manager','Press Release Manager','Podcast Manager App'],
  HRPeople: ['Employee Directory App','Leave Management System','Performance Review App','Recruiting Pipeline App','Onboarding Checklist App','Org Chart Builder App','Time Tracking App','Shift Scheduler App','Benefits Enrollment App','Training Tracker App'],
  RealEstate: ['Property Listings App','Mortgage Calculator App','Tenant Portal App','Lease Management App','Property Inspection App','Virtual Tour Scheduler','HOA Management App','Maintenance Request Tracker','Rent Collection Dashboard','Property Comparison App'],
  Food: ['Restaurant POS System','Menu Builder App','Table Reservation App','Kitchen Display System','Food Delivery Tracker','Recipe Manager App','Meal Prep Planner','Calorie Counter App','Grocery List App','Wine Cellar Inventory'],
  Productivity: ['Kanban Board App','Sprint Planner App','Time Tracker Tool','Note Taking App','Habit Tracker App','Meeting Notes App','Daily Standup Logger','Pomodoro Timer App','Goal Tracker App','Bookmarks Manager App'],
  Legal: ['Case Management App','Contract Review App','Court Calendar App','Client Intake Form App','Legal Billing Timesheets'],
  Logistics: ['Fleet Management App','Route Optimizer App','Warehouse Dashboard App','Supply Chain Tracker','Shipping Label Generator'],
  Events: ['Event Landing Page','Ticket Sales App','Guest List Manager','Conference Schedule App','Speaker Management App'],
  Creative: ['Portfolio Website App','Design System Viewer','Color Palette Generator','Typography Showcase App','Icon Library Browser'],
};

const MOBILE = {
  Social: ['Chat App','Social Feed App','Stories Viewer App','Dating App','Community Forum App','Photo Sharing App','Video Social App','Group Chat App','Profile Builder App','Activity Feed App'],
  Productivity: ['Task Manager App','Note Taking App','Habit Tracker App','Expense Logger App','Calendar App','Time Tracker App','Pomodoro App','Journal App','Bookmarks App','Voice Memo App'],
  Health: ['Step Counter App','Meditation Timer App','Water Intake App','Sleep Tracker App','Workout Log App','Calorie Counter App','Pill Reminder App','Period Tracker App','Mental Health Check App','Blood Pressure Log App'],
  Shopping: ['Product Browser App','Shopping List App','Barcode Scanner App','Wishlist App','Deal Finder App','Price Tracker App','Order Tracker App','Coupon Wallet App','Size Calculator App','Store Finder App'],
  Travel: ['Trip Planner App','Flight Tracker App','Hotel Booking App','Packing List App','Currency Converter App','City Guide App','Restaurant Finder App','Taxi Booking App','Travel Journal App','Language Phrasebook App'],
  Finance: ['Budget Tracker App','Expense Splitter App','Investment Tracker App','Bill Reminder App','Savings Goals App','Crypto Tracker App','Receipt Scanner App','Tax Estimator App','Net Worth Tracker App','Subscription Manager App'],
  Education: ['Flashcards App','Language Learning App','Math Practice App','Reading Log App','Study Timer App','Course Viewer App','Quiz App','Vocabulary Builder App','GPA Calculator App','Lecture Notes App'],
  Food: ['Recipe Finder App','Meal Planner App','Grocery List App','Restaurant Menu App','Food Diary App','Cooking Timer App','Cocktail Recipes App','Diet Tracker App','Pantry Inventory App','Takeout Ordering App'],
  Utility: ['QR Scanner App','Unit Converter App','Password Generator App','File Manager App','Compass App','Level Tool App','Color Picker App','WiFi Analyzer App','Battery Monitor App','Speed Test App'],
  Lifestyle: ['Wardrobe Organizer App','Home Workout App','Plant Care App','Pet Tracker App','Mood Journal App','Gratitude Diary App','Vision Board App','Weekly Review App','Morning Routine App','Event Countdown App'],
  Business: ['Timesheet App','Invoice Maker App','Client List App','Meeting Notes App','Business Card Scanner App','Lead Tracker App','Proposal Viewer App','Project Status App','Team Directory App','Feedback Collector App'],
  Kids: ['Drawing Pad App','Math Games App','Story Reader App','Animal Sounds App','ABC Learning App','Puzzle Games App','Music Maker App','Color Book App','Shape Sorter App','Memory Game App'],
};

const colors = {SaaS:'#0EA5E9',CRM:'#8b5cf6',Ecommerce:'#f97316',Healthcare:'#10b981',Education:'#8b5cf6',Finance:'#0EA5E9',Marketing:'#f59e0b',HRPeople:'#e879f9',RealEstate:'#f97316',Food:'#ef4444',Productivity:'#0EA5E9',Legal:'#52525b',Logistics:'#f59e0b',Events:'#a855f7',Creative:'#e879f9'};

const esc = s => s.replace(/'/g, "''");
let lines = [];

for (const [cat, apps] of Object.entries(WEB)) {
  for (const app of apps) {
    const kw = app.toLowerCase().split(/[\s&/,]+/).filter(w => w.length > 2);
    kw.push(cat.toLowerCase());
    const kwArr = '{' + kw.map(k => '"' + k + '"').join(',') + '}';
    lines.push(`INSERT INTO prebuilt_apps (name, category, description, keywords, preview_color, valid, files, use_count) SELECT '${esc(app)}', '${cat}', '${esc(app)} — ready-to-use ${cat.toLowerCase()} app.', '${kwArr}', '${colors[cat] || '#0EA5E9'}', true, '{}', 0 WHERE NOT EXISTS (SELECT 1 FROM prebuilt_apps WHERE name = '${esc(app)}');`);
  }
}

for (const [cat, apps] of Object.entries(MOBILE)) {
  for (const app of apps) {
    const name = app + ' (Mobile)';
    const kw = app.toLowerCase().split(/[\s&/,]+/).filter(w => w.length > 2);
    kw.push('mobile', 'react-native', cat.toLowerCase());
    const kwArr = '{' + kw.map(k => '"' + k + '"').join(',') + '}';
    lines.push(`INSERT INTO prebuilt_apps (name, category, description, keywords, preview_color, valid, files, use_count) SELECT '${esc(name)}', 'Mobile-${cat}', '${esc(app)} — React Native + Expo mobile app.', '${kwArr}', '#10b981', true, '{}', 0 WHERE NOT EXISTS (SELECT 1 FROM prebuilt_apps WHERE name = '${esc(name)}');`);
  }
}

console.log('-- Template bulk insert: ' + lines.length + ' templates');
console.log('-- Run this in Supabase SQL Editor');
console.log('');
console.log(lines.join('\n'));
console.log('');
console.log('-- Verify count after running:');
console.log("SELECT count(*) FROM prebuilt_apps WHERE valid = true;");
