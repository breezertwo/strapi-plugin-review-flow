import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Typography,
  Flex,
  Field,
  Textarea,
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import {
  useFetchClient,
  useNotification,
  useAPIErrorHandler,
  FetchError,
  useAuth,
} from '@strapi/strapi/admin';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useSearchParams } from 'react-router-dom';
import { PLUGIN_ID } from '../../pluginId';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';
import { getTranslation } from '../../utils/getTranslation';

type ReviewModalProps = {
  onClose: () => void;
};

export const ReviewModal = ({ onClose }: ReviewModalProps) => {
  const intl = useIntl();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';

  const user = useAuth(PLUGIN_ID, (data) => data.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await get(`/${PLUGIN_ID}/reviewers`);

      setUsers(data.data || []);
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

    setIsLoading(true);
    try {
      await post(`/${PLUGIN_ID}/assign`, {
        assignedContentType: params.slug,
        assignedDocumentId: params.id,
        locale,
        assignedTo: parseInt(selectedUser),
        comments,
      });

      toggleNotification({
        type: 'success',
        message: 'Review request sent successfully',
      });
      // Notify listeners to refresh their status
      reviewStatusEvents.emit();
      onClose();
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header>
          <Typography fontWeight="bold" as="h2">
            <FormattedMessage
              id={getTranslation('modal.header.title')}
              defaultMessage="Request review"
            />
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={4} alignItems="stretch">
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
            <Field.Root>
              <Field.Label>
                <FormattedMessage
                  id={getTranslation('modal.label.comments')}
                  defaultMessage="Comments (optional)"
                />
              </Field.Label>
              <Textarea
                value={comments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setComments(e.target.value)
                }
                placeholder={intl.formatMessage({
                  id: getTranslation('modal.placeholder.comments'),
                  defaultMessage: 'Add any notes for the reviewer...',
                })}
              />
            </Field.Root>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={onClose}
            variant="tertiary"
            style={{
              height: '3.2rem',
            }}
          >
            <FormattedMessage id={getTranslation('common.button.cancel')} defaultMessage="Cancel" />
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            style={{
              height: '3.2rem',
            }}
          >
            <FormattedMessage
              id={getTranslation('modal.button.sendRequest')}
              defaultMessage="Send review request"
            />
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
