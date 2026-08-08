# DataMind AI

You are a Senior Staff Frontend Engineer, Senior UI/UX Designer, and AI Product Designer.

Your task is to build a complete production-ready frontend for an AI-powered application called:

DataMind AI

"Conversational Database Intelligence Platform"

The application is for an AI Innovation Hackathon where users interact with databases using natural language.

The frontend must look like a premium SaaS application built by OpenAI, Notion, Linear, Vercel, and Stripe combined.

==================================================

PRIMARY GOAL

Build a ChatGPT-like interface where users can ask questions about databases.

The AI understands the question, queries the database, generates charts, flowcharts, explains results, and maintains conversation history.

The frontend should be responsive, modern, elegant, smooth, and extremely impressive for hackathon judges.

==================================================

TECH STACK

React 19

Vite

TypeScript

TailwindCSS

shadcn/ui

Framer Motion

Lucide React Icons

React Router

React Markdown

Recharts

Mermaid

React Query

Zustand

Axios

==================================================

THEME

Dark Theme

Use premium gradients.

Glassmorphism.

Soft shadows.

Rounded corners.

Modern spacing.

Elegant typography.

No cheap looking UI.

Looks like ChatGPT + Perplexity + Vercel Dashboard.

==================================================

COLOR PALETTE

Background

#09090B

Secondary

#111827

Cards

#18181B

Accent

Blue

Purple

Cyan

Success

#22C55E

Warning

#F59E0B

Error

#EF4444

==================================================

FONT

Inter

Modern spacing

Clean typography

==================================================

APPLICATION LAYOUT

Left Sidebar

Center Chat Area

Right Context Panel

Responsive

==================================================

LEFT SIDEBAR

Contains

Logo

Application Name

New Chat Button

Conversation History

Pinned Chats

Favorite Queries

Recent Queries

Settings

Database Connection Status

Theme Switch

User Profile

Storage Usage

==================================================

TOP NAVBAR

Application Name

Connected Database

AI Provider

Current Model

Connection Status

Notification Button

Settings

==================================================

CENTER CHAT

Looks exactly like ChatGPT.

Message bubbles

Streaming responses

Typing indicator

Markdown support

Code blocks

SQL syntax highlighting

Tables

Images

Charts

Mermaid Diagrams

Error Cards

Warning Cards

Copy Button

Regenerate Button

Edit Prompt

Retry

Thumbs Up

Thumbs Down

==================================================

CHAT INPUT

Large rounded textbox

Auto expanding

Voice Button

Upload Button

Send Button

Stop Generation Button

Shortcut hints

==================================================

PROCESS INDICATOR

When AI is thinking show steps

Understanding Question

Reading Database Schema

Generating SQL

Executing Query

Analyzing Data

Creating Visualization

Generating Insights

Each step animated.

==================================================

RIGHT PANEL

Conversation Memory

Current Database

Detected Tables

Generated SQL

Execution Time

Token Usage

Chart Information

==================================================

DATABASE PAGE

Database selector

SQLite

MySQL

PostgreSQL

MongoDB

Connection status

Database information

Schema browser

Tables

Columns

Relationships

==================================================

SCHEMA VIEWER

Beautiful cards

Expandable tables

Columns

Primary Keys

Foreign Keys

Relationships

==================================================

SQL VIEWER

Beautiful SQL editor

Syntax highlighting

Copy SQL

Download SQL

Execution statistics

==================================================

VISUALIZATION SUPPORT

Bar Chart

Line Chart

Pie Chart

Scatter Plot

Area Chart

Horizontal Bar Chart

Responsive

Animated

Export PNG

Fullscreen

Download

==================================================

FLOWCHART SUPPORT

Mermaid rendering

ER Diagram

Process Flow

Decision Tree

Zoom

Fullscreen

Copy Mermaid

Download SVG

==================================================

AI INSIGHTS CARD

Summary

Key Findings

Recommendations

Anomalies

Business Insights

Confidence Score

==================================================

MESSAGE TYPES

User

Assistant

System

Tool Calls

Error

Loading

==================================================

LOADING ANIMATIONS

Skeleton

Pulse

Streaming cursor

Typing animation

Chart loading

Diagram loading

==================================================

EMPTY STATE

Large AI Illustration

Headline

Example prompts

Suggested questions

Quick actions

==================================================

EXAMPLE PROMPTS

Show top 10 products by revenue

Monthly sales trend

Revenue by category

Customer growth

Inventory status

Draw ER diagram

Explain database schema

Show order workflow

==================================================

QUICK ACTION CARDS

Sales Analysis

Customer Insights

Inventory

Orders

Products

Revenue

Database Schema

Charts

==================================================

SETTINGS PAGE

Theme

AI Provider

API Status

Export

Keyboard Shortcuts

About

==================================================

EXPORT FEATURES

Download Chart PNG

Download SVG

Export CSV

Export JSON

Print Report

==================================================

ERROR HANDLING

Beautiful error cards

Retry buttons

Friendly messages

==================================================

MICRO ANIMATIONS

Every button animated.

Cards hover.

Charts animate.

Sidebar smooth.

Messages fade.

Dialogs scale.

Everything polished.

==================================================

RESPONSIVE

Desktop

Laptop

Tablet

Mobile

==================================================

ACCESSIBILITY

Keyboard navigation

ARIA labels

Focus indicators

High contrast

==================================================

PROJECT STRUCTURE

Organize professionally.

components/

pages/

hooks/

services/

contexts/

stores/

types/

utils/

assets/

==================================================

CREATE COMPONENTS

Sidebar

Navbar

ChatWindow

ChatInput

MessageBubble

StreamingMessage

SQLCard

ChartCard

MermaidCard

InsightCard

SchemaExplorer

DatabaseCard

LoadingCard

TypingIndicator

PromptSuggestions

SettingsModal

ProfileDropdown

==================================================

GENERATE

Complete folder structure.

Complete React application.

Production-ready code.

Reusable components.

Proper TypeScript types.

No placeholder UI.

No TODO comments.

No incomplete components.

Everything should compile without errors.

==================================================

DESIGN GOAL

When judges see this UI they should immediately think:

"This looks like a real commercial AI product."

The UI should feel like a billion-dollar startup product rather than a college project.

Generate the complete frontend with clean architecture and best coding practices.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6424fbd2-5b86-495b-b580-5322807c7850).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
