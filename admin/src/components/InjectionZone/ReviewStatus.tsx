import { Box, Typography, Badge, Flex, Button } from "@strapi/design-system";
import { useAuth } from "@strapi/strapi/admin";
import { useState, Fragment, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FormattedMessage, useIntl } from "react-intl";
import { CheckCircle, Cross, ArrowClockwise, CaretDown, CaretUp, Trash } from "@strapi/icons";
import {
  getStatusBackground,
  getStatusTextColor,
  getStatusString,
  getStatusBadgeText,
} from "../../utils/utils";
import { getTranslation } from "../../utils/getTranslation";
import { CommentHistory } from "../CommentHistory";
import { RejectReasonModal, ReRequestModal, CancelReviewModal } from "../modals";
import { useReviewStatusQuery, useApproveMutation, usePluginConfig } from "../../api";
import { useIsContentTypeEnabled } from "../../hooks/useIsContentTypeEnabled";

export const ReviewStatus = () => {
  const intl = useIntl();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReRequestModal, setShowReRequestModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const { data: config } = usePluginConfig();
  const locale = searchParams.get("plugins[i18n][locale]") || config?.defaultLocale || "en";
  const { user } = useAuth("ReviewStatus", (state) => state);

  const { isEnabled } = useIsContentTypeEnabled(params.slug || "");
  const { data: review, isLoading } = useReviewStatusQuery(params.slug, params.id, locale);
  const approveMutation = useApproveMutation();

  const [isHistoryOpen, setIsHistoryOpen] = useState(review?.status !== "approved");

  const handleApprove = async () => {
    if (!review?.documentId) return;
    await approveMutation.mutateAsync({ reviewId: review.documentId, locale: review.locale });
  };

  const unresolvedFieldComments = useMemo(() => {
    if (!review?.comments) return 0;
    return review.comments.filter((c) => c.commentType === "field-comment" && !c.resolved).length;
  }, [review]);

  const commentsWithApproval = useMemo(() => {
    if (!review || !review.comments || isLoading) return [];
    // Field comments are shown inline in the form - exclude them from the sidebar history
    const nonFieldComments = review.comments.filter((c) => c.commentType !== "field-comment");
    if (review.status === "approved" && review.reviewedAt) {
      const syntheticApproval = {
        id: -1,
        documentId: `synthetic-approval-${review.documentId}`,
        content: intl.formatMessage({
          id: getTranslation("commentHistory.approvalMessage"),
          defaultMessage: "Review approved",
        }),
        commentType: "approval" as const,
        createdAt: review.reviewedAt,
        author: review.assignedTo,
      };

      return [syntheticApproval, ...nonFieldComments];
    }

    return nonFieldComments;
  }, [review, intl, isLoading]);

  if (!isEnabled || isLoading || !review) {
    return null;
  }

  const isAssignedReviewer = user && review.assignedTo?.id === user.id;
  const isAssigner = user && review.assignedBy?.id === user.id;
  const isPending = review.status === "pending";
  const isRejected = review.status === "rejected";
  const showApproveRejectButtons = isAssignedReviewer && isPending;
  const canApprove = showApproveRejectButtons && !isAssigner;
  const showReRequestButton = isAssigner && isRejected;
  const showCancelButton = isAssigner && (isPending || isRejected);

  return (
    <Fragment>
      <Typography
        variant="sigma"
        textColor="neutral600"
        style={{
          alignSelf: "flex-start",
          marginTop: "1rem",
          marginBottom: "4px",
        }}
      >
        <FormattedMessage
          id={getTranslation("editview.section.header")}
          defaultMessage="Review Info"
        />
      </Typography>
      <Box
        padding={4}
        background="neutral100"
        hasRadius
        style={{
          alignSelf: "stretch",
        }}
      >
        <Flex direction="column" gap={3}>
          <Flex gap={2} alignItems="center">
            <Badge
              background={getStatusBackground(review.status)}
              textColor={getStatusTextColor(review.status)}
            >
              {getStatusBadgeText(intl, review.status)}
            </Badge>
          </Flex>

          {review.assignedTo && (
            <Typography variant="pi" textColor="neutral600">
              {getStatusString(intl, review.status)}
              {review.assignedTo.firstname} {review.assignedTo.lastname}
            </Typography>
          )}

          {showApproveRejectButtons && (
            <Flex gap={2} marginTop={2} wrap="wrap" width="100%">
              {canApprove && (
                <Button
                  startIcon={<CheckCircle />}
                  padding={1}
                  variant="success"
                  onClick={handleApprove}
                  loading={approveMutation.isPending}
                  disabled={approveMutation.isPending || unresolvedFieldComments > 0}
                  style={{ flexGrow: 1 }}
                >
                  <FormattedMessage
                    id={getTranslation("review.button.approve")}
                    defaultMessage="Approve"
                  />
                </Button>
              )}
              <Button
                startIcon={<Cross />}
                padding={1}
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                disabled={approveMutation.isPending}
                style={{ flexGrow: 1 }}
              >
                <FormattedMessage
                  id={getTranslation("review.button.reject")}
                  defaultMessage="Reject"
                />
              </Button>
            </Flex>
          )}

          {showReRequestButton && (
            <Flex marginTop={2} width="100%">
              <Button
                disabled={unresolvedFieldComments > 0}
                startIcon={<ArrowClockwise />}
                padding={1}
                variant="default"
                onClick={() => setShowReRequestModal(true)}
                style={{ flexGrow: 1, alignSelf: "stretch" }}
              >
                <FormattedMessage
                  id={getTranslation("review.button.reRequest")}
                  defaultMessage="Re-request Review"
                />
              </Button>
            </Flex>
          )}

          {showCancelButton && (
            <Flex width="100%">
              <Button
                startIcon={<Trash />}
                padding={1}
                variant="tertiary"
                onClick={() => setShowCancelModal(true)}
                style={{ flexGrow: 1, alignSelf: "stretch" }}
              >
                <FormattedMessage
                  id={getTranslation("review.button.cancel")}
                  defaultMessage="Cancel request"
                />
              </Button>
            </Flex>
          )}

          {/* Field comments block approval warning (shown to reviewer) */}
          {canApprove && unresolvedFieldComments > 0 && (
            <Box padding={2} background="neutral0" borderColor="warning700" borderRadius={2}>
              <Typography variant="pi" textColor="warning700">
                <FormattedMessage
                  id={getTranslation("fieldComment.approveBlockedWarning")}
                  defaultMessage="You need to either remove your comments or reject the current request before approving this content."
                />
              </Typography>
            </Box>
          )}

          {/* Unresolved field comments hint (shown to requester) */}
          {(isPending || review.status === "rejected") &&
            unresolvedFieldComments > 0 &&
            isAssigner && (
              <Box padding={2} background="neutral0" borderColor="warning700" borderRadius={2}>
                <Typography variant="pi" textColor="warning700">
                  <FormattedMessage
                    id={getTranslation("fieldComment.unresolvedWarning")}
                    defaultMessage="{count, plural, one {# unresolved field comment - resolve it before re-requesting} other {# unresolved field comments - resolve them before re-requesting}}"
                    values={{ count: unresolvedFieldComments }}
                  />
                </Typography>
              </Box>
            )}

          {/* Comment History */}
          {commentsWithApproval && commentsWithApproval.length > 0 && (
            <Flex
              marginTop={3}
              direction="column"
              alignItems="flex-start"
              style={{ alignSelf: "stretch" }}
            >
              <Button
                onClick={() => setIsHistoryOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  marginBottom: isHistoryOpen ? "8px" : 0,
                }}
                endIcon={
                  isHistoryOpen ? (
                    <CaretUp fill="neutral500" width="12px" height="12px" />
                  ) : (
                    <CaretDown fill="neutral500" width="12px" height="12px" />
                  )
                }
              >
                <Typography variant="sigma" textColor="neutral600">
                  <FormattedMessage
                    id={getTranslation("commentHistory.title")}
                    defaultMessage="Comment History"
                  />
                </Typography>
              </Button>
              {isHistoryOpen && <CommentHistory comments={commentsWithApproval} />}
            </Flex>
          )}
        </Flex>
      </Box>

      {showRejectModal && (
        <RejectReasonModal
          reviewId={review.documentId}
          locale={review.locale}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      {showReRequestModal && (
        <ReRequestModal
          reviewId={review.documentId}
          locale={review.locale}
          onClose={() => setShowReRequestModal(false)}
        />
      )}

      {showCancelModal && (
        <CancelReviewModal
          reviewId={review.documentId}
          locale={review.locale}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </Fragment>
  );
};
