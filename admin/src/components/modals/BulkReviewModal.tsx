import React, { useState } from 'react';
import {
  Button,
  Typography,
  Flex,
  Field,
  Textarea,
  SingleSelect,
  SingleSelectOption,
  Checkbox,
  Box,
  Modal,
  Divider,
} from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { useReviewersQuery, useBulkAssignMutation } from '../../api';

interface Document {
  documentId: string;
  locale?: string;
  [key: string]: unknown;
}

type BulkReviewModalProps = {
  documents: Document[];
  model: string;
  onClose: () => void;
};

export const BulkReviewModal = ({ documents, model, onClose }: BulkReviewModalProps) => {
  const intl = useIntl();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [comments, setComments] = useState('');
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [allLocales, setAllLocales] = useState(false);

  const { data: users = [] } = useReviewersQuery();
  const bulkAssignMutation = useBulkAssignMutation();

  const handleSubmit = async () => {
    if (!selectedUser || !confirmOverwrite) return;

    try {
      await bulkAssignMutation.mutateAsync({
        assignedContentType: model,
        assignedTo: parseInt(selectedUser),
        comments,
        documents,
        allLocales,
      });
      onClose();
    } catch {
      // error notification is handled by the mutation hook
    }
  };

  return (
    <>
      <Modal.Body>
        <Flex direction="column" gap={4} alignItems="stretch">
          <Box padding={2} background="warning100" hasRadius>
            <Flex gap={3} alignItems="center" direction="column" padding={3}>
              <Flex direction="row" gap={2}>
                <WarningCircle
                  fill="warning600"
                  width="20px"
                  height="20px"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <Typography fontWeight="bold" textColor="warning700">
                  <FormattedMessage
                    id={getTranslation('bulk.modal.warning.title')}
                    defaultMessage="You are about to request reviews for {count, plural, one {# document} other {# documents}}"
                    values={{ count: documents.length }}
                  />
                </Typography>
              </Flex>

              <Typography variant="pi" textColor="warning700">
                <FormattedMessage
                  id={getTranslation('bulk.modal.warning.description')}
                  defaultMessage="This will assign the same reviewer and comments to all selected documents. Any existing pending reviews for these documents will remain unchanged."
                />
              </Typography>
            </Flex>
          </Box>

          <Field.Root>
            <Field.Label>
              <FormattedMessage
                id={getTranslation('modal.label.assignTo')}
                defaultMessage="Assign to"
              />
            </Field.Label>
            <SingleSelect
              value={selectedUser}
              onChange={setSelectedUser}
              placeholder={intl.formatMessage({
                id: getTranslation('modal.placeholder.assignTo'),
                defaultMessage: 'Select a reviewer',
              })}
            >
              {users.map((user) => (
                <SingleSelectOption key={user.id} value={String(user.id)}>
                  {user.firstname} {user.lastname} ({user.email})
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Field.Root>

          <Divider />

          <Checkbox
            checked={allLocales}
            onCheckedChange={(checked: boolean) => setAllLocales(checked)}
          >
            <Flex direction="column" gap={1} alignItems="flex-start">
              <Typography variant="omega">
                <FormattedMessage
                  id={getTranslation('bulk.modal.checkbox.allLocales')}
                  defaultMessage="Request review for all available locales"
                />
              </Typography>
              <Typography variant="pi" textColor="neutral500">
                <FormattedMessage
                  id={getTranslation('bulk.modal.checkbox.allLocalesHint')}
                  defaultMessage="Each locale of each selected document will get a separate review request."
                />
              </Typography>
            </Flex>
          </Checkbox>

          <Divider />

          <Field.Root>
            <Field.Label>
              <FormattedMessage
                id={getTranslation('modal.label.comments')}
                defaultMessage="Comments (optional)"
              />
            </Field.Label>
            <Textarea
              value={comments}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
              placeholder={intl.formatMessage({
                id: getTranslation('modal.placeholder.comments'),
                defaultMessage: 'Add any notes for the reviewer...',
              })}
            />
          </Field.Root>

          <Checkbox
            checked={confirmOverwrite}
            onCheckedChange={(checked: boolean) => setConfirmOverwrite(checked)}
          >
            <Typography variant="pi">
              <FormattedMessage
                id={getTranslation('bulk.modal.checkbox.confirm')}
                defaultMessage="I confirm that I want to request {count, plural, one {a review} other {reviews}} for {count, plural, one {} other {all}} {count} selected {count, plural, one {document} other {documents}}"
                values={{ count: documents.length }}
              />
            </Typography>
          </Checkbox>
        </Flex>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} variant="tertiary" style={{ height: '3.2rem' }}>
          <FormattedMessage id={getTranslation('common.button.cancel')} defaultMessage="Cancel" />
        </Button>
        <Button
          onClick={handleSubmit}
          loading={bulkAssignMutation.isPending}
          disabled={!confirmOverwrite || !selectedUser}
          style={{ height: '3.2rem' }}
        >
          <FormattedMessage
            id={getTranslation('bulk.modal.button.send')}
            defaultMessage="Send {count, plural, one {# Review} other {# Reviews}}{allLocales, select, true { (all locales)} other {}}"
            values={{ count: documents.length, allLocales: String(allLocales) }}
          />
        </Button>
      </Modal.Footer>
    </>
  );
};
