import { useParams, useSearchParams } from 'react-router-dom';
import { usePluginConfig } from '../api/config';

export const useIsContentTypeEnabled = (
  uid: string,
  status?: 'published' | 'draft'
): { isEnabled: boolean; isLoading: boolean } => {
  const [params, setParams] = useSearchParams();
  const { data, isLoading } = usePluginConfig();

  const contentTypes = data?.contentTypes;
  const isEnabled =
    !isLoading &&
    (!contentTypes?.length || contentTypes.includes(uid)) &&
    (!status || status === 'draft');

  return { isEnabled, isLoading };
};
