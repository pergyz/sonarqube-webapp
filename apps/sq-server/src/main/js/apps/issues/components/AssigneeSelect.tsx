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

import { SelectAsync, SelectOption } from '@sonarsource/echoes-react';
import * as React from 'react';
import { isDefined } from '~shared/helpers/types';
import Avatar from '~sq-server-commons/components/ui/Avatar';
import { CurrentUserContext } from '~sq-server-commons/context/current-user/CurrentUserContext';
import { translate, translateWithParameters } from '~sq-server-commons/helpers/l10n';
import { Issue } from '~sq-server-commons/types/types';
import { RestUser, UserActive, isLoggedIn, isUserActive } from '~sq-server-commons/types/users';
import { searchAssignees } from '~sq-server-commons/utils/issues-utils';

// exported for test
export const MIN_QUERY_LENGTH = 2;

const UNASSIGNED: Option = { value: '', label: translate('unassigned') };

interface Option extends SelectOption {
  Icon?: React.JSX.Element;
}

export interface AssigneeSelectProps {
  className?: string;
  inputId: string;
  issues: Issue[];
  label: string;
  onAssigneeSelect: (assigneeKey: string) => void;
  selectedAssigneeKey?: string;
}

function userToOption(user: RestUser | UserActive) {
  const userInfo = user.name ?? user.login;
  return {
    value: user.login,
    label: isUserActive(user) ? userInfo : translateWithParameters('user.x_deleted', userInfo),
    Icon: <Avatar className="sw-my-1" hash={user.avatar} name={user.name} size="xs" />,
  };
}

export default function AssigneeSelect(props: Readonly<AssigneeSelectProps>) {
  const { className, issues, inputId, label, selectedAssigneeKey } = props;

  const { currentUser } = React.useContext(CurrentUserContext);

  const [options, setOptions] = React.useState<Option[]>();

  const defaultOptions = React.useMemo((): Option[] => {
    const allowCurrentUserSelection =
      isLoggedIn(currentUser) && issues.some((issue) => currentUser.login !== issue.assignee);

    return allowCurrentUserSelection ? [UNASSIGNED, userToOption(currentUser)] : [UNASSIGNED];
  }, [currentUser, issues]);

  const handleAssigneeSearch = React.useCallback(
    async (query: string) => {
      if (query.length < MIN_QUERY_LENGTH) {
        setOptions(defaultOptions);
        return;
      }

      const assignees = await searchAssignees(query).then(({ results }) =>
        results.map(userToOption),
      );

      setOptions(assignees);
    },
    [defaultOptions],
  );

  return (
    <SelectAsync
      ariaLabel={translate('issue_bulk_change.assignee.change')}
      className={className}
      data={options ?? defaultOptions}
      helpText={translateWithParameters('select.search.tooShort', MIN_QUERY_LENGTH)}
      id={inputId}
      label={label}
      labelNotFound={translate('select.search.noMatches')}
      onChange={props.onAssigneeSelect}
      onSearch={handleAssigneeSearch}
      optionComponent={AssigneeOption}
      value={selectedAssigneeKey}
    />
  );
}

function AssigneeOption(props: Readonly<Option>) {
  const { Icon, label } = props;

  return (
    <div className="sw-flex sw-flex-nowrap sw-items-center sw-overflow-hidden">
      {isDefined(Icon) && <span className="sw-mr-2">{Icon}</span>}
      <span className="sw-whitespace-nowrap sw-text-ellipsis">{label}</span>
    </div>
  );
}
