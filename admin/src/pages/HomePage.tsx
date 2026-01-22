import React, { useState, useEffect } from 'react';
import {
  Page,
  Layouts,
  useNotification,
  useAPIErrorHandler,
  FetchError,
} from '@strapi/strapi/admin';
import {
  Box,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Button,
} from '@strapi/design-system';
import { CheckCircle, Cross } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';

export const HomePage = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();

  const fetchPendingReviews = async () => {
    try {
      setIsLoading(true);
      const { data } = await get(`/${PLUGIN_ID}/pending`);
      setReviews(data.data || []);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleApprove = async (reviewId: string) => {
    try {
      await put(`/${PLUGIN_ID}/approve/${reviewId}`, {});
      toggleNotification({
        type: 'success',
        message: 'Review approved successfully',
      });
      fetchPendingReviews();
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await put(`/${PLUGIN_ID}/reject/${reviewId}`, {});
      toggleNotification({
        type: 'success',
        message: 'Review rejected successfully',
      });
      fetchPendingReviews();
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    }
  };

  return (
    <Page.Main>
      <Page.Title>Review Workflow</Page.Title>
      <Layouts.Header
        title="Pending Reviews"
        subtitle="Review and approve content before publication"
      />
      <Layouts.Content>
        <Box padding={8} background="neutral0">
          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : reviews.length === 0 ? (
            <Typography>No pending reviews</Typography>
          ) : (
            <Table colCount={6} rowCount={reviews.length}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography variant="sigma">Content Type</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Document ID</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Locale</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Assigned By</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Status</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Actions</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {reviews.map((review) => (
                  <Tr key={review.documentId}>
                    <Td>
                      <Typography>{review.assignedContentType}</Typography>
                    </Td>
                    <Td>
                      <Typography>{review.assignedDocumentId}</Typography>
                    </Td>
                    <Td>
                      <Badge>{review.locale}</Badge>
                    </Td>
                    <Td>
                      <Typography>
                        {review.assignedBy?.firstname} {review.assignedBy?.lastname}
                      </Typography>
                    </Td>
                    <Td>
                      <Badge>{review.status}</Badge>
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <Button
                          startIcon={<CheckCircle />}
                          size="S"
                          variant="success"
                          onClick={() => handleApprove(review.documentId)}
                        >
                          Approve
                        </Button>
                        <Button
                          startIcon={<Cross />}
                          size="S"
                          variant="danger"
                          onClick={() => handleReject(review.documentId)}
                        >
                          Reject
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Layouts.Content>
    </Page.Main>
  );
};
