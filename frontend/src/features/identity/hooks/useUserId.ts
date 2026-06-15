import { useMemo } from 'react';

import { identityService } from '@/features/identity/services';

export const useUserId = (): string =>
  useMemo(() => identityService.getUserId(), []);
