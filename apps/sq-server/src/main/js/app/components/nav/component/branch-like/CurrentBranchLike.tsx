/*
 * SonarQube
 * Copyright (C) 2009-2025 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import * as React from 'react';
import { ChevronDownIcon, TextMuted } from '~design-system';
import BranchLikeIcon from '~sq-server-commons/components/icon-mappers/BranchLikeIcon';
import QualityGateStatus from '~sq-server-commons/components/nav/QualityGateStatus';
import { getBranchLikeDisplayName } from '~sq-server-commons/helpers/branch-like';
import { BranchLike, BranchStatusData } from '~sq-server-commons/types/branch-like';

export interface CurrentBranchLikeProps extends Pick<BranchStatusData, 'status'> {
  currentBranchLike: BranchLike;
}

export function CurrentBranchLike(props: CurrentBranchLikeProps) {
  const { currentBranchLike } = props;

  const displayName = getBranchLikeDisplayName(currentBranchLike);

  return (
    <div className="sw-flex sw-items-center sw-truncate">
      <BranchLikeIcon branchLike={currentBranchLike} />
      <TextMuted className="sw-ml-3" text={displayName} />
      <QualityGateStatus branchLike={currentBranchLike} className="sw-ml-4" />
      <ChevronDownIcon className="sw-ml-1" />
    </div>
  );
}

export default React.memo(CurrentBranchLike);
