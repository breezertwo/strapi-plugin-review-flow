import React, { useState } from 'react';
import { Button, Field, Textarea, Flex } from '@strapi/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { Message } from '@strapi/icons';
import { useAddFieldCommentMutation } from '../../api';
import { getTranslation } from '../../utils/getTranslation';
import { Box } from '@strapi/design-system';
import { Tooltip } from '@strapi/design-system';

export interface FieldCommentButtonProps {
  fieldName: string;
  reviewDocumentId: string;
  locale: string;
}

export const FieldCommentButton = ({ fieldName, reviewDocumentId, locale }: FieldCommentButtonProps) => {
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
      <Tooltip
        label={intl.formatMessage({
          id: getTranslation('fieldComment.button.tooltip'),
          defaultMessage: 'Add a dedicated comment to this field',
        })}
      >
        <button
          type="button"
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
      </Tooltip>

      {open && (
        <Box
          position="absolute"
          top="22px"
          left="0"
          zIndex={9999}
          width="280px"
          padding="12px"
          background="neutral0"
          borderColor="neutral100"
          borderStyle="solid"
          borderWidth="1px"
          borderRadius="4px"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <Field.Root error={error || undefined} style={{ gap: 8 }}>
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
            <Field.Error />
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
        </Box>
      )}
    </span>
  );
};
