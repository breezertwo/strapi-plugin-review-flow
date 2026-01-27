import React from 'react';
import { Box, Typography, Badge, Flex } from '@strapi/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';

interface Comment {
  id: number;
  documentId: string;
  content: string;
  commentType: 'assignment' | 'rejection' | 're-request' | 'approval' | 'general';
  createdAt: string;
  author?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

interface CommentHistoryProps {
  comments: Comment[];
}

const getCommentTypeConfig = (
  commentType: string
): { background: string; textColor: string; labelId: string; defaultLabel: string } => {
  switch (commentType) {
    case 'assignment':
      return {
        background: 'primary100',
        textColor: 'primary700',
        labelId: 'commentHistory.type.assignment',
        defaultLabel: 'Assignment',
      };
    case 'rejection':
      return {
        background: 'danger100',
        textColor: 'danger700',
        labelId: 'commentHistory.type.rejection',
        defaultLabel: 'Rejection',
      };
    case 're-request':
      return {
        background: 'warning100',
        textColor: 'warning700',
        labelId: 'commentHistory.type.re-request',
        defaultLabel: 'Re-request',
      };
    case 'approval':
      return {
        background: 'success100',
        textColor: 'success700',
        labelId: 'commentHistory.type.approval',
        defaultLabel: 'Approval',
      };
    default:
      return {
        background: 'neutral100',
        textColor: 'neutral700',
        labelId: 'commentHistory.type.general',
        defaultLabel: 'Comment',
      };
  }
};

const getTimelineDotColor = (commentType: string): string => {
  switch (commentType) {
    case 'rejection':
      return '#ee5e52';
    case 'approval':
      return '#5cb176';
    case 're-request':
      return '#f29d41';
    default:
      return '#4945ff';
  }
};

const formatRelativeTime = (dateString: string, intl: ReturnType<typeof useIntl>): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return intl.formatMessage(
      { id: getTranslation('commentHistory.time.seconds'), defaultMessage: '{count}s ago' },
      { count: diffInSeconds }
    );
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return intl.formatMessage(
      { id: getTranslation('commentHistory.time.minutes'), defaultMessage: '{count}m ago' },
      { count: diffInMinutes }
    );
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return intl.formatMessage(
      { id: getTranslation('commentHistory.time.hours'), defaultMessage: '{count}h ago' },
      { count: diffInHours }
    );
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return intl.formatMessage(
      { id: getTranslation('commentHistory.time.days'), defaultMessage: '{count}d ago' },
      { count: diffInDays }
    );
  }

  // For older dates, show the actual date
  return date.toLocaleDateString();
};

export const CommentHistory = ({ comments }: CommentHistoryProps) => {
  const intl = useIntl();

  if (!comments || comments.length === 0) {
    return (
      <Box padding={4} background="neutral100" hasRadius>
        <Typography variant="pi" textColor="neutral600">
          <FormattedMessage
            id={getTranslation('commentHistory.empty')}
            defaultMessage="No comments yet"
          />
        </Typography>
      </Box>
    );
  }

  // Sort comments by createdAt ascending (oldest first for timeline view)
  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div style={{ width: '100%' }}>
      <Typography variant="sigma" textColor="neutral600">
        <FormattedMessage
          id={getTranslation('commentHistory.title')}
          defaultMessage="Comment History"
        />
      </Typography>
      <div style={{ paddingTop: '8px', width: '100%' }}>
        {sortedComments.map((comment, index) => {
          const config = getCommentTypeConfig(comment.commentType);
          const isLast = index === sortedComments.length - 1;
          const authorName = comment.author
            ? `${comment.author.firstname || ''} ${comment.author.lastname || ''}`.trim() ||
              'Unknown'
            : 'Unknown';

          return (
            <div
              key={comment.documentId || comment.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                width: '100%',
              }}
            >
              {/* Timeline column - fixed width */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '20px',
                  minWidth: '20px',
                  flexShrink: 0,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getTimelineDotColor(comment.commentType),
                    flexShrink: 0,
                    marginTop: '4px',
                  }}
                />
                {/* Line */}
                {!isLast && (
                  <div
                    style={{
                      width: '2px',
                      flexGrow: 1,
                      backgroundColor: '#dcdce4',
                      minHeight: '20px',
                    }}
                  />
                )}
              </div>

              {/* Comment content - takes remaining space */}
              <Box
                padding={3}
                background="neutral0"
                hasRadius
                style={{
                  flex: 1,
                  marginLeft: '12px',
                  marginBottom: isLast ? 0 : '8px',
                  border: '1px solid #dcdce4',
                }}
              >
                <Flex
                  justifyContent="flex-start"
                  alignItems="center"
                  marginBottom={2}
                  gap={2}
                  wrap="wrap"
                >
                  <Badge background={config.background} textColor={config.textColor}>
                    <FormattedMessage
                      id={getTranslation(config.labelId)}
                      defaultMessage={config.defaultLabel}
                    />
                  </Badge>
                  <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                    {authorName}
                  </Typography>
                  <Typography variant="pi" textColor="neutral500">
                    {formatRelativeTime(comment.createdAt, intl)}
                  </Typography>
                </Flex>
                <Typography variant="omega" textColor="neutral700">
                  {comment.content}
                </Typography>
              </Box>
            </div>
          );
        })}
      </div>
    </div>
  );
};
