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
import { useReviewersQuery, useAvailableLocalesQuery, useAssignMutation, usePluginConfig } from '../../api';

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
  const { data: config } = usePluginConfig();
  const currentLocale =
    searchParams.get('plugins[i18n][locale]') || config?.defaultLocale || 'en';

  useAuth(PLUGIN_ID, (data) => data.user);

  const { data: users = [] } = useReviewersQuery();
  const { data: availableLocales = [], isLoading: isLocalesLoading } = useAvailableLocalesQuery(
    params.slug,
    params.id
  );
  const assignMutation = useAssignMutation();

  useEffect(() => {
    // Initialize selected locales once the available locales query resolves.
    // For non-i18n content types availableLocales will contain only the default
    // locale; for i18n types it lists all document locales.
    if (!isLocalesLoading && selectedLocales.length === 0) {
      const initialLocale =
        availableLocales.includes(currentLocale) ? currentLocale : (availableLocales[0] ?? currentLocale);
      setSelectedLocales([initialLocale]);
    }
  }, [isLocalesLoading, availableLocales, currentLocale]);

  const handleLocalesChange = (next: string[]) => {
    // Always keep the current locale selected (it cannot be deselected by the user)
    if (availableLocales.includes(currentLocale) && !next.includes(currentLocale)) {
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
          <Typography fontWeight="bold">
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
                onChange={(value: string | number) => setSelectedUser(value.toString())}
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
