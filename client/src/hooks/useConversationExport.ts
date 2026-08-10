import { useCallback } from 'react';
import type { Message } from '../types';

interface SessionAnalysis {
  topics: string[];
  vocabularyHighlights: string[];
  improvements: string[];
  summary: string;
}

function analyzeConversation(messages: Message[]): SessionAnalysis {
  const coachMessages = messages.filter((m) => m.role === 'assistant').map((m) => m.content.toLowerCase());
  const conversationText = messages.map((m) => m.content).join(' ').toLowerCase();

  const topicsKeywords: { [key: string]: string[] } = {
    pronunciation: ['pronunciation', 'pronounce', 'sound', 'accent', 'phonetic'],
    grammar: ['grammar', 'tense', 'verb', 'plural', 'sentence structure', 'correct'],
    vocabulary: ['vocabulary', 'words', 'phrases', 'synonyms', 'definition'],
    business: ['business', 'professional', 'meeting', 'presentation', 'corporate'],
    conversation: ['conversation', 'fluency', 'natural', 'speaking', 'dialogue'],
  };

  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(topicsKeywords)) {
    if (keywords.some((kw) => conversationText.includes(kw))) {
      topics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
    }
  }

  const vocabularyHighlights = extractVocabulary(coachMessages);
  const improvements = extractImprovements(coachMessages);
  const summary = generateSummary(messages);

  return { topics: topics.length > 0 ? topics : ['General English'], vocabularyHighlights, improvements, summary };
}

function extractVocabulary(coachMessages: string[]): string[] {
  const vocabulary: string[] = [];
  const patterns = [
    /(?:word|phrase|vocabulary).*?["\']([^"\']+)["\']/gi,
    /(?:means?|definition).*?["\']([^"\']+)["\']/gi,
  ];

  coachMessages.forEach((msg) => {
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(msg)) !== null) {
        vocabulary.push(match[1]);
      }
    });
  });

  return vocabulary.slice(0, 5);
}

function extractImprovements(coachMessages: string[]): string[] {
  const improvements: string[] = [];
  const patterns = [
    /(?:work on|focus on|practice|improve)\s+([A-Za-z][^.!?]*)/gi,
    /(?:could|should)\s+practice\s+([A-Za-z][^.!?]*)/gi,
  ];

  coachMessages.forEach((msg) => {
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(msg)) !== null) {
        if (match[1]) {
          const text = match[1].trim();
          if (text.length > 5 && text.length < 100 && !improvements.includes(text)) {
            improvements.push(text);
          }
        }
      }
    });
  });

  return improvements.slice(0, 4);
}

function generateSummary(messages: Message[]): string {
  if (messages.length === 0) return 'No messages in this session.';

  const userMessages = messages.filter((m) => m.role === 'user').length;
  const coachMessages = messages.filter((m) => m.role === 'assistant').length;

  return `This session included ${userMessages} user message(s) and ${coachMessages} coach response(s). The conversation focused on English learning and coaching with personalized feedback.`;
}

export function useConversationExport() {
  const exportAsJSON = useCallback((messages: Message[], filename?: string) => {
    const analysis = analyzeConversation(messages);
    const data = {
      exportDate: new Date().toISOString(),
      sessionDate: messages[0]?.timestamp.toISOString() || new Date().toISOString(),
      messageCount: messages.length,
      duration: messages.length > 0 ? `${Math.round((messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime()) / 60000)} minutes` : '0 minutes',
      topics: analysis.topics,
      summary: analysis.summary,
      messages: messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
        mode: m.type === 'voice' ? 'Voice' : 'Text',
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    downloadFile(blob, filename || `conversation-${Date.now()}.json`);
  }, []);

  const exportAsMarkdown = useCallback((messages: Message[], filename?: string) => {
    const analysis = analyzeConversation(messages);
    const sessionDate = new Date();
    const sessionDuration = messages.length > 1
      ? Math.round((messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime()) / 60000)
      : 0;

    let md = '# English Coaching Session Transcript\n\n';
    md += `**Date:** ${sessionDate.toLocaleString()}\n`;
    md += `**Duration:** ${sessionDuration} minutes\n`;
    md += `**Total Messages:** ${messages.length}\n`;
    md += `**Topics Covered:** ${analysis.topics.join(', ')}\n\n`;

    md += '---\n\n';

    md += '## Session Summary\n\n';
    md += `${analysis.summary}\n\n`;

    if (analysis.vocabularyHighlights.length > 0) {
      md += '## Vocabulary Highlights\n\n';
      analysis.vocabularyHighlights.forEach((vocab) => {
        md += `- ${vocab}\n`;
      });
      md += '\n';
    }

    if (analysis.improvements.length > 0) {
      md += '## Areas for Improvement\n\n';
      analysis.improvements.forEach((improvement) => {
        md += `- ${improvement}\n`;
      });
      md += '\n';
    }

    md += '---\n\n';
    md += '## Conversation Transcript\n\n';

    messages.forEach((msg, i) => {
      const mode = msg.type === 'voice' ? 'Voice' : 'Text';
      md += `### Message ${i + 1} - [${mode}]\n\n`;
      md += `**${msg.role === 'user' ? 'You' : 'Coach'}**\n\n`;
      md += `${msg.content}\n\n`;
      md += `*${msg.timestamp.toLocaleTimeString()}*\n\n`;
    });

    md += '---\n\n';
    md += '## Next Steps\n\n';
    md += '- Review the areas for improvement above\n';
    md += '- Practice the vocabulary highlighted in this session\n';
    md += '- Record yourself speaking about topics covered today\n';
    md += '- Schedule your next coaching session\n';

    const blob = new Blob([md], { type: 'text/markdown' });
    downloadFile(blob, filename || `conversation-${Date.now()}.md`);
  }, []);

  const exportAsCSV = useCallback((messages: Message[], filename?: string) => {
    const headers = ['Timestamp', 'Speaker', 'Mode', 'Message'];
    const rows = messages.map((msg) => [
      msg.timestamp.toLocaleTimeString(),
      msg.role === 'user' ? 'You' : 'Coach',
      msg.type === 'voice' ? 'Voice' : 'Text',
      `"${msg.content.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, filename || `conversation-${Date.now()}.csv`);
  }, []);

  return { exportAsJSON, exportAsMarkdown, exportAsCSV };
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
