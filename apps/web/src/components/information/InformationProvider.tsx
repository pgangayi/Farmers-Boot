/**
 * INFORMATION PROVIDER COMPONENT
 * ==============================
 * Main provider component for the information system
 */

import React, { useState, useEffect, useCallback } from 'react';
import InfoModal from './InfoModal';
import type { InfoTopic } from '../../types/information';
import {
  useInfoTopicByContext,
  useRelatedTopics,
  useRecordTopicView,
  useSubmitTopicFeedback,
} from '@/api/hooks/useInformation';

interface InformationProviderProps {
  children: React.ReactNode;
}

interface InformationState {
  isOpen: boolean;
  topic: InfoTopic | null;
  relatedTopics: InfoTopic[];
  isLoading: boolean;
  error: string | null;
}

export function InformationProvider({ children }: InformationProviderProps) {
  const [state, setState] = useState<InformationState>({
    isOpen: false,
    topic: null,
    relatedTopics: [],
    isLoading: false,
    error: null,
  });

  const [contextParams, setContextParams] = useState<{
    contextKey: string;
    pagePath: string;
    componentName?: string;
  } | null>(null);

  // API hooks
  const {
    data: topicData,
    isLoading: topicLoading,
    error: topicError,
  } = useInfoTopicByContext(
    contextParams
      ? {
          contextKey: contextParams.contextKey,
          pagePath: contextParams.pagePath,
          componentName: contextParams.componentName,
        }
      : undefined
  );

  const { data: relatedData } = useRelatedTopics(state.topic?.id);

  const recordViewMutation = useRecordTopicView();
  const feedbackMutation = useSubmitTopicFeedback();

  // Update state when topic data changes
  useEffect(() => {
    if (topicData) {
      setState(prev => ({
        ...prev,
        topic: topicData,
        isLoading: false,
        error: null,
      }));

      // Record view
      if (topicData.id && contextParams) {
        recordViewMutation.mutate({
          topicId: topicData.id,
          contextKey: contextParams.contextKey,
          pagePath: contextParams.pagePath,
        });
      }
    }
  }, [topicData, contextParams, recordViewMutation]);

  // Update related topics when available
  useEffect(() => {
    if (relatedData) {
      setState(prev => ({
        ...prev,
        relatedTopics: relatedData,
      }));
    }
  }, [relatedData]);

  // Handle loading state
  useEffect(() => {
    if (topicLoading) {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    }
  }, [topicLoading]);

  // Handle error state
  useEffect(() => {
    if (topicError) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: topicError instanceof Error ? topicError.message : 'Failed to load information',
      }));
    }
  }, [topicError]);

  // Handle modal open requests from InfoIcon components
  const handleOpenModal = useCallback(async (event: CustomEvent) => {
    const { contextKey, pagePath, componentName } = event.detail;

    // Set context params to trigger API fetch
    setContextParams({
      contextKey,
      pagePath,
      componentName,
    });

    // Open modal with loading state
    setState({
      isOpen: true,
      topic: null,
      relatedTopics: [],
      isLoading: true,
      error: null,
    });
  }, []);

  // Handle topic change
  const handleTopicChange = useCallback(
    (newTopic: InfoTopic) => {
      setState(prev => ({
        ...prev,
        topic: newTopic,
        isLoading: false,
      }));

      // Record view for new topic
      if (newTopic.id && contextParams) {
        recordViewMutation.mutate({
          topicId: newTopic.id,
          contextKey: contextParams.contextKey,
          pagePath: contextParams.pagePath,
        });
      }
    },
    [contextParams, recordViewMutation]
  );

  // Handle modal close
  const handleClose = useCallback(() => {
    setState({
      isOpen: false,
      topic: null,
      relatedTopics: [],
      isLoading: false,
      error: null,
    });
    setContextParams(null);
  }, []);

  // Handle topic rating
  const handleRateTopic = useCallback(
    async (topicId: string, rating: number, comment?: string) => {
      try {
        await feedbackMutation.mutateAsync({
          topicId,
          rating,
          helpful: rating >= 4,
          comment,
        });

        // Show success message
        if (rating >= 4) {
          // Could use a toast notification here
          console.log('Thank you for your feedback!');
        }
      } catch (error) {
        console.error('Error rating topic:', error);
      }
    },
    [feedbackMutation]
  );

  // Set up global event listener
  useEffect(() => {
    window.addEventListener('openInfoModal', handleOpenModal as unknown as EventListener);
    return () => {
      window.removeEventListener('openInfoModal', handleOpenModal as unknown as EventListener);
    };
  }, [handleOpenModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [state.isOpen, handleClose]);

  return (
    <>
      {children}
      <InfoModal
        isOpen={state.isOpen}
        onClose={handleClose}
        topic={state.topic}
        relatedTopics={state.relatedTopics}
        onTopicChange={handleTopicChange}
        onRateTopic={handleRateTopic}
      />
    </>
  );
}

export default InformationProvider;
