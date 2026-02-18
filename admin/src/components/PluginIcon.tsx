import { CheckCircle } from '@strapi/icons';
import { Badge, Flex } from '@strapi/design-system';
import { useTaskCount } from '../hooks/useTaskCount';

export const PluginIcon = () => {
  const count = useTaskCount();

  return (
    <Flex position="relative">
      <CheckCircle />
      {count > 0 && (
        <Badge
          active
          style={{
            position: 'absolute',
            top: '-16px',
            left: '8px',
            borderRadius: 45,
            transform: 'scale(.85)',
          }}
        >
          {count}
        </Badge>
      )}
    </Flex>
  );
};
