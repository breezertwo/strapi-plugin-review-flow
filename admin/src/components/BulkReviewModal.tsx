import React, { useState, useEffect } from 'react';
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
} from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import {
  useFetchClient,
  useNotification,
  useAPIErrorHandler,
  FetchError,
} from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { reviewStatusEvents } from '../utils/reviewStatusEvents';

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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await get('/admin/users');
      setUsers(data.data.results || []);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toggleNotification({
        type: 'warning',
        message: 'Please select a reviewer',
      });
      return;
    }

    if (!confirmOverwrite) {
      toggleNotification({
        type: 'warning',
        message: 'Please confirm that you want to request reviews for multiple documents',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await post(`/${PLUGIN_ID}/bulk-assign`, {
        assignedContentType: model,
        assignedTo: parseInt(selectedUser),
        comments,
        documents: documents.map((doc) => ({
          documentId: doc.documentId,
          locale: doc.locale || 'en',
        })),
      });

      const results = data.data;
      const successCount = results.success.length;
      const errorCount = results.failed.length;

      if (successCount > 0) {
        toggleNotification({
          type: 'success',
          message: `Review requests sent successfully for ${successCount} document${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
        });
        // Notify listeners to refresh their status
        reviewStatusEvents.emit();
      }

      if (errorCount > 0 && successCount === 0) {
        toggleNotification({
          type: 'danger',
          message: `Failed to send review requests for all ${errorCount} documents`,
        });
      }

      onClose();
    } catch (error: any) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal.Body>
        <Flex direction="column" gap={4}>
          <Box padding={4} background="warning100" hasRadius>
            <Flex gap={3} alignItems="flex-start">
              <WarningCircle
                fill="warning600"
                width="20px"
                height="20px"
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <Flex direction="column" gap={1}>
                <Typography fontWeight="bold" textColor="warning700">
                  You are about to request reviews for {documents.length} document
                  {documents.length > 1 ? 's' : ''}
                </Typography>
                <Typography variant="pi" textColor="warning700">
                  This will assign the same reviewer and comments to all selected documents. Any
                  existing pending reviews for these documents will remain unchanged.
                </Typography>
              </Flex>
            </Flex>
          </Box>

          <Field.Root>
            <Field.Label>Assign to</Field.Label>
            <SingleSelect
              value={selectedUser}
              onChange={setSelectedUser}
              placeholder="Select a reviewer"
            >
              {users.map((user) => (
                <SingleSelectOption key={user.id} value={String(user.id)}>
                  {user.firstname} {user.lastname} ({user.email})
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Field.Root>

          <Field.Root>
            <Field.Label>Comments (optional)</Field.Label>
            <Textarea
              value={comments}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
              placeholder="Add any notes for the reviewer..."
            />
          </Field.Root>

          <Checkbox
            checked={confirmOverwrite}
            onCheckedChange={(checked: boolean) => setConfirmOverwrite(checked)}
          >
            <Typography variant="pi">
              I confirm that I want to request reviews for all {documents.length} selected document
              {documents.length > 1 ? 's' : ''}
            </Typography>
          </Checkbox>
        </Flex>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} variant="tertiary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!confirmOverwrite || !selectedUser}
        >
          Send {documents.length} Review Request{documents.length > 1 ? 's' : ''}
        </Button>
      </Modal.Footer>
    </>
  );
};
