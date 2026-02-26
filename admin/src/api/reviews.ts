import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useFetchClient,
  useNotification,
  useAPIErrorHandler,
  FetchError,
} from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../pluginId';
import { getTranslation } from '../utils/getTranslation';
import { batchStatusManager } from '../utils/batchStatusManager';
import { reviewKeys } from './queryKeys';
import type { Review } from '../types/review';

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export const usePendingReviewsQuery = () => {
  const { get } = useFetchClient();
  return useQuery({
    queryKey: reviewKeys.pending(),
    queryFn: async () => {
      const { data } = await get(`/${PLUGIN_ID}/pending`);
      return (data.data || []) as Review[];
    },
  });
};

export const useRejectedReviewsQuery = () => {
  const { get } = useFetchClient();
  return useQuery({
    queryKey: reviewKeys.rejected(),
    queryFn: async () => {
      const { data } = await get(`/${PLUGIN_ID}/rejected`);
      return (data.data || []) as Review[];
    },
  });
};

export const useAssignedByMeReviewsQuery = () => {
  const { get } = useFetchClient();
  return useQuery({
    queryKey: reviewKeys.assignedByMe(),
    queryFn: async () => {
      const { data } = await get(`/${PLUGIN_ID}/assigned-by-me`);
      return (data.data || []) as Review[];
    },
  });
};

export const useReviewStatusQuery = (
  slug: string | undefined,
  id: string | undefined,
  locale: string
) => {
  const { get } = useFetchClient();
  return useQuery({
    queryKey: reviewKeys.status(slug ?? '', id ?? '', locale),
    queryFn: async () => {
      const { data } = await get(`/${PLUGIN_ID}/status/${slug}/${id}/${locale}`);
      return (data.data as Review | null) ?? null;
    },
    enabled: Boolean(slug) && Boolean(id),
  });
};

export const useReviewersQuery = () => {
  const { get } = useFetchClient();
  return useQuery({
    queryKey: reviewKeys.reviewers(),
    queryFn: async () => {
      const { data } = await get(`/${PLUGIN_ID}/reviewers`);
      return (data.data || []) as {
        id: number;
        firstname?: string;
        lastname?: string;
        email: string;
      }[];
    },
    staleTime: 60_000,
  });
};

export const useAvailableLocalesQuery = (
  contentType: string | undefined,
  documentId: string | undefined
) => {
  const { get } = useFetchClient();
  return useQuery({
    queryKey: reviewKeys.availableLocales(contentType ?? '', documentId ?? ''),
    queryFn: async () => {
      const encodedContentType = encodeURIComponent(contentType!);
      const { data } = await get(
        `/${PLUGIN_ID}/available-locales/${encodedContentType}/${documentId}`
      );
      return (data.data || []) as string[];
    },
    enabled: Boolean(contentType) && Boolean(documentId),
    staleTime: 60_000,
  });
};

export const useReviewStatusCellQuery = (documentId: string, model: string, locale: string) => {
  const fetchClient = useFetchClient();
  batchStatusManager.setFetchClient(fetchClient);

  return useQuery({
    queryKey: reviewKeys.batchStatus(model, locale, documentId),
    queryFn: () => batchStatusManager.requestStatus(documentId, model, locale),
    enabled: Boolean(documentId),
  });
};

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export const useApproveMutation = () => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const intl = useIntl();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, locale }: { reviewId: string; locale: string }) =>
      put(`/${PLUGIN_ID}/approve/${reviewId}/${locale}`, {}),
    onSuccess: () => {
      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.approved'),
          defaultMessage: 'Review approved successfully',
        }),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

export const useRejectMutation = () => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const intl = useIntl();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      locale,
      rejectionReason,
    }: {
      reviewId: string;
      locale: string;
      rejectionReason: string;
    }) => put(`/${PLUGIN_ID}/reject/${reviewId}/${locale}`, { rejectionReason }),
    onSuccess: () => {
      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.rejected'),
          defaultMessage: 'Review rejected successfully',
        }),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

export const useReRequestMutation = () => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const intl = useIntl();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      locale,
      comment,
    }: {
      reviewId: string;
      locale: string;
      comment: string;
    }) => put(`/${PLUGIN_ID}/re-request/${reviewId}/${locale}`, { comment }),
    onSuccess: () => {
      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.reRequested'),
          defaultMessage: 'Review re-requested successfully',
        }),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

export const useAddFieldCommentMutation = () => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewDocumentId,
      content,
      fieldName,
      locale,
    }: {
      reviewDocumentId: string;
      content: string;
      fieldName: string;
      locale: string;
    }) => post(`/${PLUGIN_ID}/field-comments`, { reviewDocumentId, content, fieldName, locale }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

export const useDeleteFieldCommentMutation = () => {
  const { del } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentDocumentId }: { commentDocumentId: string }) =>
      del(`/${PLUGIN_ID}/field-comments/${commentDocumentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

export const useResolveFieldCommentMutation = () => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentDocumentId }: { commentDocumentId: string }) =>
      put(`/${PLUGIN_ID}/field-comments/${commentDocumentId}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

export const useAssignMutation = () => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const intl = useIntl();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignedContentType,
      assignedDocumentId,
      locales,
      assignedTo,
      comments,
    }: {
      assignedContentType: string | undefined;
      assignedDocumentId: string | undefined;
      locales: string[];
      assignedTo: number;
      comments: string;
    }) => {
      if (locales.length === 1) {
        return post(`/${PLUGIN_ID}/assign`, {
          assignedContentType,
          assignedDocumentId,
          locale: locales[0],
          assignedTo,
          comments,
        });
      }
      return post(`/${PLUGIN_ID}/assign-multi-locale`, {
        assignedContentType,
        assignedDocumentId,
        locales,
        assignedTo,
        comments,
      });
    },
    onSuccess: (_data, variables) => {
      const count = variables.locales.length;
      toggleNotification({
        type: 'success',
        message: intl.formatMessage(
          {
            id: getTranslation('modal.notification.success'),
            defaultMessage:
              '{count, plural, one {Review request sent} other {Review requests sent for # locales}}',
          },
          { count }
        ),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};

interface BulkAssignVariables {
  assignedContentType: string;
  assignedTo: number;
  comments: string;
  documents: { documentId: string; locale?: string }[];
  allLocales: boolean;
}

export const useBulkAssignMutation = () => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const intl = useIntl();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignedContentType,
      assignedTo,
      comments,
      documents,
      allLocales,
    }: BulkAssignVariables) => {
      let expandedDocuments: { documentId: string; locale: string }[];

      if (!allLocales) {
        expandedDocuments = documents.map((doc) => ({
          documentId: doc.documentId,
          locale: doc.locale || 'en',
        }));
      } else {
        const encodedModel = encodeURIComponent(assignedContentType);
        const localeResults = await Promise.allSettled(
          documents.map((doc) =>
            get(`/${PLUGIN_ID}/available-locales/${encodedModel}/${doc.documentId}`).then(
              ({ data }) => ({ documentId: doc.documentId, locales: (data.data as string[]) || [] })
            )
          )
        );

        expandedDocuments = [];
        for (let i = 0; i < localeResults.length; i++) {
          const result = localeResults[i];
          if (result.status === 'fulfilled' && result.value.locales.length > 0) {
            for (const locale of result.value.locales) {
              expandedDocuments.push({ documentId: result.value.documentId, locale });
            }
          } else {
            expandedDocuments.push({
              documentId: documents[i].documentId,
              locale: documents[i].locale || 'en',
            });
          }
        }
      }

      const { data } = await post(`/${PLUGIN_ID}/bulk-assign`, {
        assignedContentType,
        assignedTo,
        comments,
        documents: expandedDocuments,
      });

      return data.data as { success: unknown[]; failed: unknown[] };
    },
    onSuccess: (results) => {
      const successCount = results.success.length;
      const errorCount = results.failed.length;

      if (successCount > 0 && errorCount === 0) {
        toggleNotification({
          type: 'success',
          message: intl.formatMessage(
            {
              id: getTranslation('bulk.notification.success'),
              defaultMessage: 'Review requests sent successfully for {successCount} document(s)',
            },
            { successCount }
          ),
        });
      } else if (successCount > 0 && errorCount > 0) {
        toggleNotification({
          type: 'warning',
          message: intl.formatMessage(
            {
              id: getTranslation('bulk.notification.partial'),
              defaultMessage:
                'Review requests sent successfully for {successCount} document(s). {errorCount} failed.',
            },
            { successCount, errorCount }
          ),
        });
      } else {
        toggleNotification({
          type: 'danger',
          message: intl.formatMessage(
            {
              id: getTranslation('bulk.notification.error'),
              defaultMessage: 'Failed to send review requests for all {errorCount} documents',
            },
            { errorCount }
          ),
        });
      }

      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (error) => {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    },
  });
};
