import { Box, Flex, Typography } from '@strapi/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { Check, Trash } from '@strapi/icons';
import { useResolveFieldCommentMutation, useDeleteFieldCommentMutation } from '../../api';
import { getTranslation } from '../../utils/getTranslation';
import type { Comment } from '../../types/review';

export interface FieldCommentDisplayProps {
  fieldName: string;
  comments: Comment[];
  canResolve: boolean;
  canDelete: boolean;
  currentUserId?: string | number;
}

export const FieldCommentDisplay = ({
  fieldName,
  comments,
  canResolve,
  canDelete,
  currentUserId,
}: FieldCommentDisplayProps) => {
  const intl = useIntl();
  const resolveMutation = useResolveFieldCommentMutation();
  const deleteMutation = useDeleteFieldCommentMutation();
  const fieldComments = comments.filter(
    (c) => c.commentType === 'field-comment' && c.fieldName === fieldName
  );

  if (fieldComments.length === 0) return null;

  return (
    <div style={{ marginTop: '4px', marginBottom: '4px' }}>
      {fieldComments.map((comment, index) => {
        const authorName = comment.author
          ? `${comment.author.firstname || ''} ${comment.author.lastname || ''}`.trim() ||
            'Reviewer'
          : 'Reviewer';
        const isOwnComment = canDelete && comment.author?.id === currentUserId;

        return (
          <Box
            background={comment.resolved ? 'success100' : 'warning100'}
            key={comment.documentId}
            style={{
              borderLeft: `3px solid ${comment.resolved ? '#328048' : '#f29d41'}`,
              borderRadius: '0 4px 4px 0',
              padding: '6px 10px',
              marginBottom: '4px',
              opacity: comment.resolved ? 0.6 : 1,
            }}
          >
            <Flex alignItems="flex-start" justifyContent="space-between" gap={2}>
              <div style={{ flex: 1 }}>
                <Typography
                  variant="pi"
                  fontWeight="semiBold"
                  textColor="neutral600"
                  style={{ display: 'block' }}
                >
                  {authorName}
                  {comment.resolved && (
                    <span style={{ marginLeft: '6px', color: '#5cb176', fontSize: '11px' }}>
                      ✓{' '}
                      {intl.formatMessage({
                        id: getTranslation('fieldComment.resolved'),
                        defaultMessage: 'resolved',
                      })}
                    </span>
                  )}
                </Typography>
                <Typography
                  variant="pi"
                  textColor="neutral700"
                  style={{
                    display: 'block',
                    marginTop: '2px',
                    textDecoration: comment.resolved ? 'line-through' : 'none',
                  }}
                >
                  {comment.content}
                </Typography>
              </div>
              <Flex gap={1} alignItems="center">
                {canResolve && fieldComments.length === index + 1 && (
                  <button
                    type="button"
                    title={
                      comment.resolved
                        ? intl.formatMessage({
                            id: getTranslation('fieldComment.button.unresolve'),
                            defaultMessage: 'Mark as unresolved',
                          })
                        : intl.formatMessage({
                            id: getTranslation('fieldComment.button.resolve'),
                            defaultMessage: 'Mark as resolved',
                          })
                    }
                    disabled={resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({ commentDocumentId: comment.documentId })
                    }
                    style={{
                      background: 'none',
                      border: `1px solid ${comment.resolved ? '#c0c0cf' : '#5cb176'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: comment.resolved ? '#8e8ea9' : '#5cb176',
                      padding: '2px 6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Check width="10px" height="10px" />
                    {comment.resolved ? (
                      <FormattedMessage
                        id={getTranslation('fieldComment.button.unresolve')}
                        defaultMessage="Unresolve"
                      />
                    ) : (
                      <FormattedMessage
                        id={getTranslation('fieldComment.button.resolve')}
                        defaultMessage="Resolve"
                      />
                    )}
                  </button>
                )}
                {isOwnComment && (
                  <button
                    type="button"
                    title={intl.formatMessage({
                      id: getTranslation('fieldComment.button.delete'),
                      defaultMessage: 'Remove comment',
                    })}
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ commentDocumentId: comment.documentId })}
                    style={{
                      background: 'none',
                      border: '1px solid #dcdce4',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#8e8ea9',
                      padding: '2px 5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash width="10px" height="10px" />
                  </button>
                )}
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </div>
  );
};
