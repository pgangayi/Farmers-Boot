/**
 * INFO MODAL COMPONENT
 * ===================
 * Modal for displaying rich information content
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  BookOpen,
  ExternalLink,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import type { InfoModalProps, InfoTopic, TableOfContents } from '../../types/information';

export function InfoModal({
  isOpen,
  onClose,
  topic,
  relatedTopics = [],
  onTopicChange,
  onRateTopic,
}: InfoModalProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [userRating, setUserRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<TableOfContents[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate table of contents from content
  useEffect(() => {
    if (!topic?.content) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = topic.content;

    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: TableOfContents[] = Array.from(headings).map((heading, index) => ({
      id: `heading-${index}`,
      title: heading.textContent || '',
      level: parseInt(heading.tagName.substring(1)),
      anchor: heading.textContent?.toLowerCase().replace(/\s+/g, '-') || '',
    }));

    setTableOfContents(toc);
  }, [topic?.content]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRating = (rating: number) => {
    setUserRating(rating);
    if (onRateTopic && topic) {
      onRateTopic(topic.id, rating, feedbackComment);
    }
  };

  const handleFeedbackSubmit = () => {
    if (onRateTopic && topic) {
      onRateTopic(topic.id, userRating, feedbackComment);
      setShowFeedback(false);
      setFeedbackComment('');
    }
  };

  const handleShare = async () => {
    if (navigator.share && topic) {
      try {
        await navigator.share({
          title: topic.title,
          text: topic.summary,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${topic.title}: ${topic.summary}`);
      }
    }
  };

  const scrollToSection = (anchor: string) => {
    const element = contentRef.current?.querySelector(`[data-anchor="${anchor}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'w-4 h-4 transition-colors',
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300',
          interactive && 'cursor-pointer hover:text-yellow-400'
        )}
        onClick={() => interactive && handleRating(i + 1)}
      />
    ));
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return 'Quick read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">{topic?.title}</h2>
              {topic?.category && (
                <Badge variant="secondary" className="text-xs">
                  {topic.category.name}
                </Badge>
              )}
            </div>

            {topic && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatReadingTime(topic.reading_time_minutes)}</span>
                </div>
                <Badge className={getDifficultyColor(topic.difficulty_level)}>
                  {topic.difficulty_level}
                </Badge>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{topic.view_count} views</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Contents</h3>
                <nav className="space-y-1">
                  {tableOfContents.map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.anchor)}
                      className={cn(
                        'w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 transition-colors',
                        activeSection === item.anchor && 'bg-blue-50 text-blue-700'
                      )}
                      style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Related Topics */}
            {relatedTopics.length > 0 && (
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">Related Topics</h3>
                <div className="space-y-2">
                  {relatedTopics.map(relatedTopic => (
                    <button
                      key={relatedTopic.id}
                      onClick={() => onTopicChange && onTopicChange(relatedTopic)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {relatedTopic.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {relatedTopic.summary}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {topic?.image_url && (
                <div className="mb-6">
                  <img
                    src={topic.image_url}
                    alt={topic.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {topic?.video_url && (
                <div className="mb-6">
                  <video
                    src={topic.video_url}
                    controls
                    className="w-full rounded-lg"
                    poster={topic.image_url}
                  />
                </div>
              )}

              <div
                ref={contentRef}
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: topic?.content || '' }}
              />

              {/* External Links */}
              {topic?.external_links && topic.external_links.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">External Resources</h3>
                  <div className="space-y-2">
                    {topic.external_links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {topic?.tags && topic.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {topic.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Was this helpful?</span>
              <div className="flex items-center gap-1">{renderStars(userRating, true)}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(!showFeedback)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showFeedback ? 'Cancel' : 'Add Feedback'}
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              Last updated: {topic ? new Date(topic.updated_at).toLocaleDateString() : ''}
            </div>
          </div>

          {/* Feedback Form */}
          {showFeedback && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <textarea
                placeholder="Share your feedback..."
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setShowFeedback(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleFeedbackSubmit}>
                  Submit Feedback
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Default export
export default InfoModal;
