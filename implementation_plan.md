# Implementation Plan - Seed of Thought (생각의 씨앗)

## 📋 project Overview
'Seed of Thought' is an AI-powered diary service for children that starts from a single sentence and expands into a full diary through conversation.

# AI Persona Refinement & Initial Question Logic

This plan outlines the updates to the AI's system persona and conversation flow to provide a more professional and focused experience for the child.

## Proposed Changes

### Backend

#### [MODIFY] [ChatService](file:///Users/kyouhwayeon/Documents/Seed%20of%20Thought/backend/src/chat/chat.service.ts)
- **Refine System Persona**: Update `AI_PERSONA` to act as a "Professional Child Reading Counselor".
    - Focus on eliciting the child's thoughts rather than just simple praise.
    - Include instructions to handle off-topic or "strange" responses by gently guiding the conversation back to the theme of the book/sentence.
- **Update Initial Question Logic**: Modify `startConversation` to explicitly include the **book title** and the **child's chosen sentence** in the first prompt, ensuring the AI welcomes the child with this specific context.

## Verification Plan

### Manual Verification
- Start a new chat session to verify the initial question includes the book title and sentence.
- Send an off-topic message (e.g., "I want pizza") and verify if the AI gently steers the conversation back to the book.
- Check if the AI's tone and depth feel like a professional counselor.

## 📅 5-Day Roadmap

### Day 0: Project Setup & Environment (Completed ✅)
- [x] Initialize Backend (NestJS)
- [x] Initialize Frontend (React Native)
- [x] Environment Variables Configuration
- [x] Design System Tokens Definition

### Day 1: Base Structure & DB Design (Completed ✅)
- [x] Database Schema Design (Prisma/PostgreSQL)
- [x] Home Screen UI
- [x] Authentication Setup (Social Login)

### Day 2: Seed Planting (Input & OCR) (Completed ✅)
- [x] Book Search API Integration
- [x] Sentence Input (Manual/OCR)
- [x] Google Vision API Integration

### Day 3: Sprout Assistant (AI Conversation) (Completed ✅)
- [x] OpenAI GPT-4o-mini Integration
- [x] AI Persona & Prompt Engineering
- [x] Chat UI & STT (Whisper)

### Day 4: Sprouting (Diary Generation) (Completed ✅)
- [x] Diary Generation Logic
- [x] Edit & Save Diary UI
- [x] Image Upload (S3/Firebase) - Link metadata implemented

### Day 5: Fruit Bearing (Output & Reports) (Completed ✅)
- [x] Archive & Detail View
- [x] Growth Report Dashboard
- [x] PDF/Image Export Logic (Placeholder implemented)
- [x] Final Polishing & QA

## 🛠 Tech Stack
- **Frontend**: React Native, Zustand, Styled-components, Lottie
- **Backend**: NestJS, Prisma, PostgreSQL
- **AI**: OpenAI GPT-4o-mini, Whisper, Google Vision API
- **Infra**: AWS S3, Firebase
