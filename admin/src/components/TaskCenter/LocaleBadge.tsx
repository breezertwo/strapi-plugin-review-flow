import React from 'react';
import { Badge, Tooltip } from '@strapi/design-system';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { getEditUrl, getStatusBadgeProps, formatContentType } from '../../utils/formatters';

interface LocaleBadgeProps {
  locale: string;
  status: string;
  contentType: string;
  documentId: string;
}

export const LocaleBadge = ({ locale, status, contentType, documentId }: LocaleBadgeProps) => {
  const navigate = useNavigate();
  const intl = useIntl();
  const badgeProps = getStatusBadgeProps(status);
  const contentTypeLabel = formatContentType(contentType);

  const tooltipLabel = intl.formatMessage(
    {
      id: getTranslation('taskCenter.badge.goToLocale'),
      defaultMessage: 'Go to {contentType} in {locale}',
    },
    { contentType: contentTypeLabel, locale }
  );

  return (
    <Tooltip label={tooltipLabel}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate(getEditUrl(contentType, documentId, locale));
        }}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '1px',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.06)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <Badge background={badgeProps.background} textColor={badgeProps.textColor}>
          {locale}
        </Badge>
      </button>
    </Tooltip>
  );
};
