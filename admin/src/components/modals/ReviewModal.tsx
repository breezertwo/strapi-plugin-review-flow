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
  MultiSelect,
  MultiSelectOption,
} from '@strapi/design-system';
import { useAuth } from '@strapi/strapi/admin';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useSearchParams } from 'react-router-dom';
import { PLUGIN_ID } from '../../pluginId';
import { getTranslation } from '../../utils/getTranslation';
import { useReviewersQuery, useAvailableLocalesQuery, useAssignMutation } from '../../api';

type ReviewModalProps = {
  onClose: () => void;
};

export const ReviewModal = ({ onClose }: ReviewModalProps) => {
  const intl = useIntl();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [comments, setComments] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const currentLocale = searchParams.get('plugins[i18n][locale]') || 'en';

  useAuth(PLUGIN_ID, (data) => data.user);

  const { data: users = [] } = useReviewersQuery();
  const { data: availableLocales = [] } = useAvailableLocalesQuery(params.slug, params.id);
  const assignMutation = useAssignMutation();

  useEffect(() => {
    if (availableLocales.length > 0 && selectedLocales.length === 0) {
      setSelectedLocales([currentLocale]);
    }
  }, [availableLocales, currentLocale]);

  const handleLocalesChange = (next: string[]) => {
    if (!next.includes(currentLocale)) {
      setSelectedLocales([currentLocale, ...next]);
    } else {
      setSelectedLocales(next);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      return;
    }

    if (selectedLocales.length === 0) {
      return;
    }

    try {
      await assignMutation.mutateAsync({
        assignedContentType: params.slug,
        assignedDocumentId: params.id,
        locales: selectedLocales,
        assignedTo: parseInt(selectedUser),
        comments,
      });
      onClose();
    } catch {
      // error notification is handled by the mutation hook
    }
  };

  const showLocalePicker = availableLocales.length > 1;

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

            {showLocalePicker && (
              <Field.Root>
                <Field.Label>
                  <FormattedMessage
                    id={getTranslation('modal.label.locales')}
                    defaultMessage="Locales to review"
                  />
                </Field.Label>
                <MultiSelect
                  value={selectedLocales}
                  onChange={handleLocalesChange}
                  placeholder={intl.formatMessage({
                    id: getTranslation('modal.placeholder.locales'),
                    defaultMessage: 'Select locales',
                  })}
                  withTags
                >
                  {availableLocales.map((locale) => (
                    <MultiSelectOption
                      key={locale}
                      value={locale}
                      disabled={locale === currentLocale}
                    >
                      {locale === currentLocale
                        ? intl.formatMessage(
                            {
                              id: getTranslation('modal.locale.currentOption'),
                              defaultMessage: '{locale} (current)',
                            },
                            { locale }
                          )
                        : locale}
                    </MultiSelectOption>
                  ))}
                </MultiSelect>
              </Field.Root>
            )}

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
            loading={assignMutation.isPending}
            style={{
              height: '3.2rem',
            }}
          >
            <FormattedMessage
              id={getTranslation('modal.button.sendRequest')}
              defaultMessage={
                selectedLocales.length > 1
                  ? `Send review requests (${selectedLocales.length} locales)`
                  : 'Send review request'
              }
            />
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
