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

import { find } from 'lodash';
import * as React from 'react';
import { FlagMessage, Modal, TextMuted } from '~design-system';
import SelectList, {
  SelectListFilter,
  SelectListSearchParams,
} from '~sq-server-commons/components/controls/SelectList';
import { translate } from '~sq-server-commons/helpers/l10n';
import { definitions } from '~sq-server-commons/helpers/mocks/definitions-list';
import {
  useAddGroupMembershipMutation,
  useGroupMembersQuery,
  useRemoveGroupMembersQueryFromCache,
  useRemoveGroupMembershipMutation,
} from '~sq-server-commons/queries/group-memberships';
import { Group } from '~sq-server-commons/types/types';
import { RestUserBase } from '~sq-server-commons/types/users';
import useSamlConfiguration from '../../settings/components/authentication/hook/useSamlConfiguration';
import { SAML } from '../../settings/components/authentication/SamlAuthenticationTab';

const samlDefinitions = definitions.filter((def) => def.subCategory === SAML);

interface Props {
  group: Group;
  onClose: () => void;
}

export default function EditMembersModal(props: Readonly<Props>) {
  const { group } = props;

  const [query, setQuery] = React.useState<string>('');
  const [changedUsers, setChangedUsers] = React.useState<Map<string, boolean>>(new Map());
  const [filter, setFilter] = React.useState<SelectListFilter>(SelectListFilter.Selected);
  const { mutateAsync: addUserToGroup } = useAddGroupMembershipMutation();
  const { mutateAsync: removeUserFromGroup } = useRemoveGroupMembershipMutation();
  const { data, isLoading, fetchNextPage } = useGroupMembersQuery({
    q: query,
    groupId: group.id,
    filter,
  });
  const emptyQueryCache = useRemoveGroupMembersQueryFromCache();

  const { samlEnabled } = useSamlConfiguration(samlDefinitions);

  const users: (RestUserBase & { selected?: boolean })[] =
    data?.pages.flatMap((page) => page.users) ?? [];

  const modalHeader = translate('users.update');

  const handleSelect = (userId: string) =>
    addUserToGroup({
      groupId: group.id,
      userId,
    }).then(() => {
      const newChangedUsers = new Map(changedUsers);
      newChangedUsers.set(userId, true);
      setChangedUsers(newChangedUsers);
    });

  const handleUnselect = (userId: string) =>
    removeUserFromGroup({
      userId,
      groupId: group.id,
    }).then(() => {
      const newChangedUsers = new Map(changedUsers);
      newChangedUsers.set(userId, false);
      setChangedUsers(newChangedUsers);
    });

  const renderElement = (id: string): React.ReactNode => {
    const user = find(users, { id });
    if (!user) {
      return null;
    }

    return (
      <div>
        {user.name}
        <br />
        <TextMuted text={user.login} />
      </div>
    );
  };

  const onSearch = (searchParams: SelectListSearchParams) => {
    setQuery(searchParams.query);
    setFilter(searchParams.filter);
    if (searchParams.page === 1) {
      emptyQueryCache();
      setChangedUsers(new Map());
    } else {
      fetchNextPage();
    }
  };

  return (
    <Modal
      body={
        <>
          {samlEnabled && (
            <FlagMessage className="sw-mb-2" variant="warning">
              {translate('users.update_groups.saml_enabled')}
            </FlagMessage>
          )}
          <SelectList
            elements={users.map((user) => user.id)}
            elementsTotalCount={data?.pages[0].page.total}
            loading={isLoading}
            needToReload={changedUsers.size > 0 && filter !== SelectListFilter.All}
            onSearch={onSearch}
            onSelect={handleSelect}
            onUnselect={handleUnselect}
            renderElement={renderElement}
            selectedElements={users
              .filter((u) => (changedUsers.has(u.id) ? changedUsers.get(u.id) : u.selected))
              .map((u) => u.id)}
            withPaging
          />
        </>
      }
      headerTitle={modalHeader}
      onClose={props.onClose}
      secondaryButtonLabel={translate('done')}
    />
  );
}
