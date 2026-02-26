import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Button, Field, Textarea, Typography, Flex } from '@strapi/design-system';
import { useAuth } from '@strapi/strapi/admin';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Check, Message, Trash } from '@strapi/icons';
import {
  useReviewStatusQuery,
  useAddFieldCommentMutation,
  useResolveFieldCommentMutation,
  useDeleteFieldCommentMutation,
} from '../../api';
import { getTranslation } from '../../utils/getTranslation';
import { useIsContentTypeEnabled } from '../../hooks/useIsContentTypeEnabled';
import type { Comment } from '../../types/review';
import { Box } from '@strapi/design-system';

// ─── FieldCommentButton ───────────────────────────────────────────────────────
// Only shown to the reviewer when the review is pending.

interface FieldCommentButtonProps {
  fieldName: string;
  reviewDocumentId: string;
  locale: string;
}

const FieldCommentButton = ({ fieldName, reviewDocumentId, locale }: FieldCommentButtonProps) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useAddFieldCommentMutation();

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError(
        intl.formatMessage({
          id: getTranslation('fieldComment.validation.required'),
          defaultMessage: 'Comment cannot be empty',
        })
      );
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({ reviewDocumentId, content: text.trim(), fieldName, locale });
      setText('');
      setOpen(false);
    } catch {
      // error handled by mutation hook
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '6px',
        position: 'relative',
      }}
    >
      <button
        type="button"
        title={intl.formatMessage({
          id: getTranslation('fieldComment.button.add'),
          defaultMessage: 'Add field comment',
        })}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '4px',
          color: open ? '#4945ff' : '#8e8ea9',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Message width="14px" height="14px" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '22px',
            left: 0,
            zIndex: 9999,
            width: '260px',
            background: '#fff',
            border: '1px solid #dcdce4',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            padding: '12px',
          }}
        >
          <Field.Root error={error || undefined}>
            <Field.Label>
              <FormattedMessage
                id={getTranslation('fieldComment.popover.label')}
                defaultMessage="Comment on this field"
              />
            </Field.Label>
            <Textarea
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={intl.formatMessage({
                id: getTranslation('fieldComment.popover.placeholder'),
                defaultMessage: 'What needs attention here?',
              })}
              style={{ minHeight: '72px', fontSize: '12px' }}
            />
            {error && <Field.Error>{error}</Field.Error>}
          </Field.Root>
          <Flex gap={2} marginTop={2} justifyContent="flex-end">
            <Button
              variant="tertiary"
              size="S"
              onClick={() => {
                setOpen(false);
                setText('');
                setError(null);
              }}
            >
              <FormattedMessage
                id={getTranslation('common.button.cancel')}
                defaultMessage="Cancel"
              />
            </Button>
            <Button variant="default" size="S" loading={mutation.isPending} onClick={handleSubmit}>
              <FormattedMessage
                id={getTranslation('fieldComment.popover.submit')}
                defaultMessage="Add"
              />
            </Button>
          </Flex>
        </div>
      )}
    </span>
  );
};

// ─── FieldCommentDisplay ──────────────────────────────────────────────────────
// Shown in both pending and rejected states.
// - canResolve: requester can toggle resolved (pending or rejected)
// - canDelete: reviewer can delete their own comments (pending only)

interface FieldCommentDisplayProps {
  fieldName: string;
  comments: Comment[];
  canResolve: boolean;
  canDelete: boolean;
  currentUserId?: string | number;
}

const FieldCommentDisplay = ({
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
      {fieldComments.map((comment) => {
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
              <Flex gap={1} flexShrink={0} alignItems="center">
                {canResolve && (
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

// ─── FieldCommentOverlay ──────────────────────────────────────────────────────
// Active in both 'pending' and 'rejected' states:
//   pending  → reviewer sees add-button + delete button; requester sees resolve button
//   rejected → both roles see comments as read-only history with resolve button for requester

interface PortalTarget {
  fieldName: string;
  buttonMount: HTMLElement | null;
  displayMount: HTMLElement | null;
}

export const FieldCommentOverlay = () => {
  const params = useParams<{ id: string; slug: string; status: 'published' | 'draft' }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';
  const { user } = useAuth('FieldCommentOverlay', (state) => state);
  const { isEnabled } = useIsContentTypeEnabled(params.slug || '');

  const { data: review } = useReviewStatusQuery(params.slug, params.id, locale);

  const [portalTargets, setPortalTargets] = useState<PortalTarget[]>([]);
  const mountNodesRef = useRef<HTMLElement[]>([]);
  // Signature of the last successful build: fieldNames + review state.
  // Guards against unnecessary rebuilds (e.g. typing in block editor triggers MutationObserver).
  const lastSigRef = useRef<string>('');

  const isReviewer = Boolean(user && review?.assignedTo?.id === user.id);
  const isRequester = Boolean(user && review?.assignedBy?.id === user.id);
  const isPending = review?.status === 'pending';
  const isRejected = review?.status === 'rejected';
  // Overlay is active for both pending and rejected states
  const isActive = isPending || isRejected;

  // Only show add button (and delete button) while review is still pending
  const canAddComments = isPending && isReviewer;
  // Requester can resolve/unresolve in either state
  const canResolve = isRequester;

  const buildPortalTargets = useCallback(() => {
    if (!isActive || !review?.documentId || (!isReviewer && !isRequester)) {
      mountNodesRef.current.forEach((node) => {
        try {
          node.parentElement?.removeChild(node);
        } catch {
          /* already removed */
        }
      });
      mountNodesRef.current = [];
      lastSigRef.current = '';
      setPortalTargets([]);
      return;
    }

    // Label-first discovery: scan every labeled field in the form.
    // This is more reliable than searching by input element because:
    //   - Every Strapi field has a <label id="..."> regardless of input type
    //   - Block editor fields use a toolbar combobox (no native input), but do have
    //     an element with aria-labelledby pointing to the label
    //   - Starting from the label avoids walk-up ambiguity for nested custom widgets

    // Phase 1: collect (label, fieldName) pairs — needed for the signature check
    const allLabels = Array.from(document.querySelectorAll<HTMLLabelElement>('main label[id]'));

    // Pre-build a lookup map: aria-labelledby value → named element (for block editors etc.)
    const ariaLabelledElements = Array.from(
      document.querySelectorAll<HTMLElement>('[aria-labelledby][name]')
    );

    const seenFieldNames = new Set<string>();
    const labelFieldPairs: { label: HTMLLabelElement; fieldName: string }[] = [];

    for (const label of allLabels) {
      let fieldName: string | null = null;

      // Primary: label.for → element.name  (native inputs, checkboxes, relations)
      if (label.htmlFor) {
        const el = document.getElementById(label.htmlFor);
        const name = el?.getAttribute('name');
        const type = (el as HTMLInputElement | null)?.type;
        if (name && type !== 'hidden') fieldName = name;
      }

      // Fallback: element with aria-labelledby matching this label's id + name attribute
      // Catches block editor comboboxes: <div name="teaser_text" aria-labelledby=":id:-label">
      if (!fieldName && label.id) {
        const ariaEl = ariaLabelledElements.find((el) =>
          el.getAttribute('aria-labelledby')?.split(' ').includes(label.id)
        );
        if (ariaEl) fieldName = ariaEl.getAttribute('name');
      }

      if (!fieldName || seenFieldNames.has(fieldName)) continue;
      seenFieldNames.add(fieldName);
      labelFieldPairs.push({ label, fieldName });
    }

    // Build a signature to skip redundant rebuilds (e.g. typing in the editor)
    const fieldNamesStr = labelFieldPairs
      .map(({ fieldName }) => fieldName)
      .sort()
      .join(',');
    const commentsSig = (review.comments || [])
      .map((c) => `${c.documentId}:${c.resolved}`)
      .join(',');
    const sig = `${fieldNamesStr}|${review.status}|${commentsSig}`;

    if (sig === lastSigRef.current && mountNodesRef.current.length > 0) {
      return; // Nothing relevant changed — skip rebuild
    }
    lastSigRef.current = sig;

    // Phase 2: clear old mount nodes and create new portals
    mountNodesRef.current.forEach((node) => {
      try {
        node.parentElement?.removeChild(node);
      } catch {
        /* already removed */
      }
    });
    mountNodesRef.current = [];

    const targets: PortalTarget[] = [];

    for (const { label, fieldName } of labelFieldPairs) {
      // Button mount: inserted right after the label element
      // (no walk-up needed — we already have the label as our anchor)
      let buttonMount: HTMLElement | null = null;
      if (canAddComments) {
        buttonMount = document.createElement('span');
        label.parentElement?.insertBefore(buttonMount, label.nextSibling);
        mountNodesRef.current.push(buttonMount);
      }

      // Display mount: inserted after the label row (label.parentElement) but before
      // the actual input widget — so comment cards appear between the title and the field.
      let displayMount: HTMLElement | null = null;
      const hasComments = (review.comments || []).some(
        (c) => c.commentType === 'field-comment' && c.fieldName === fieldName
      );
      if (hasComments) {
        displayMount = document.createElement('div');
        const labelRow = label.parentElement;
        labelRow?.parentElement?.insertBefore(displayMount, labelRow.nextSibling);
        mountNodesRef.current.push(displayMount);
      }

      if (buttonMount || displayMount) {
        targets.push({ fieldName, buttonMount, displayMount });
      }
    }

    setPortalTargets(targets);
  }, [isActive, canAddComments, isReviewer, isRequester, review]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEnabled || !review) {
      mountNodesRef.current.forEach((node) => {
        try {
          node.parentElement?.removeChild(node);
        } catch {
          /* already gone */
        }
      });
      mountNodesRef.current = [];
      setPortalTargets([]);
      return;
    }

    const timer = setTimeout(buildPortalTargets, 150);

    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      setTimeout(buildPortalTargets, 150);
    });
    const main = document.querySelector('main');
    if (main) {
      observer.observe(main, { childList: true, subtree: false });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isEnabled, review, buildPortalTargets]);

  // Cleanup mount nodes on unmount
  useEffect(() => {
    return () => {
      mountNodesRef.current.forEach((node) => {
        try {
          node.parentElement?.removeChild(node);
        } catch {
          /* already gone */
        }
      });
    };
  }, []);

  if (!isEnabled || !review || !isActive || (!isReviewer && !isRequester)) {
    return null;
  }

  return (
    <>
      {portalTargets.map(({ fieldName, buttonMount, displayMount }) => (
        <React.Fragment key={fieldName}>
          {canAddComments &&
            buttonMount &&
            ReactDOM.createPortal(
              <FieldCommentButton
                fieldName={fieldName}
                reviewDocumentId={review.documentId}
                locale={locale}
              />,
              buttonMount
            )}
          {displayMount &&
            ReactDOM.createPortal(
              <FieldCommentDisplay
                fieldName={fieldName}
                comments={review.comments || []}
                canResolve={canResolve}
                canDelete={canAddComments}
                currentUserId={user?.id}
              />,
              displayMount
            )}
        </React.Fragment>
      ))}
    </>
  );
};
