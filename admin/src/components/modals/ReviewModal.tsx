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
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const currentLocale = searchParams.get('plugins[i18n][locale]') || 'en';

  useAuth(PLUGIN_ID, (data) => data.user);

  useEffect(() => {
    fetchUsers();
    fetchAvailableLocales();
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

  const fetchAvailableLocales = async () => {
    if (!params.slug || !params.id) return;
    try {
      const encodedContentType = encodeURIComponent(params.slug);
      const { data } = await get(
        `/${PLUGIN_ID}/available-locales/${encodedContentType}/${params.id}`
      );
      const locales: string[] = data.data || [];
      setAvailableLocales(locales);
      setSelectedLocales([currentLocale]);
    } catch {
      setAvailableLocales([currentLocale]);
      setSelectedLocales([currentLocale]);
    }
  };

  const handleLocalesChange = (next: string[]) => {
    if (!next.includes(currentLocale)) {
      setSelectedLocales([currentLocale, ...next]);
    } else {
      setSelectedLocales(next);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toggleNotification({
        type: 'warning',
        message: intl.formatMessage({
          id: getTranslation('modal.validation.selectReviewer'),
          defaultMessage: 'Please select a reviewer',
        }),
      });
      return;
    }

    if (selectedLocales.length === 0) {
      toggleNotification({
        type: 'warning',
        message: intl.formatMessage({
          id: getTranslation('modal.validation.selectLocale'),
          defaultMessage: 'Please select at least one locale',
        }),
      });
      return;
    }

    setIsLoading(true);
    try {
      const localesArray = selectedLocales;

      if (localesArray.length === 1) {
        await post(`/${PLUGIN_ID}/assign`, {
          assignedContentType: params.slug,
          assignedDocumentId: params.id,
          locale: localesArray[0],
          assignedTo: parseInt(selectedUser),
          comments,
        });
      } else {
        await post(`/${PLUGIN_ID}/assign-multi-locale`, {
          assignedContentType: params.slug,
          assignedDocumentId: params.id,
          locales: localesArray,
          assignedTo: parseInt(selectedUser),
          comments,
        });
      }

      toggleNotification({
        type: 'success',
        message: intl.formatMessage(
          {
            id: getTranslation('modal.notification.success'),
            defaultMessage:
              '{count, plural, one {Review request sent} other {Review requests sent for # locales}}',
          },
          { count: localesArray.length }
        ),
      });
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
            loading={isLoading}
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
