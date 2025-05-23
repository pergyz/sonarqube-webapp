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

import { without } from 'lodash';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { LargeCenteredLayout, PageContentFontWrapper } from '~design-system';
import * as api from '~sq-server-commons/api/permissions';
import AllHoldersList from '~sq-server-commons/components/permissions/AllHoldersList';
import { FilterOption } from '~sq-server-commons/components/permissions/SearchForm';
import { translate } from '~sq-server-commons/helpers/l10n';
import {
  PERMISSIONS_ORDER_FOR_PROJECT_TEMPLATE,
  convertToPermissionDefinitions,
} from '~sq-server-commons/helpers/permissions';
import {
  Paging,
  PermissionGroup,
  PermissionTemplate,
  PermissionUser,
} from '~sq-server-commons/types/types';
import ProvisioningWarning from './ProvisioningWarning';
import TemplateDetails from './TemplateDetails';
import TemplateHeader from './TemplateHeader';

interface Props {
  refresh: () => void;
  template: PermissionTemplate;
  topQualifiers: string[];
}

interface State {
  filter: FilterOption;
  groups: PermissionGroup[];
  groupsPaging?: Paging;
  loading: boolean;
  query: string;
  selectedPermission?: string;
  users: PermissionUser[];
  usersPaging?: Paging;
}

export default class Template extends React.PureComponent<Props, State> {
  mounted = false;
  state: State = {
    filter: 'all',
    groups: [],
    loading: false,
    query: '',
    users: [],
  };

  componentDidMount() {
    this.mounted = true;
    this.requestHolders();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  loadUsersAndGroups = (usersPage?: number, groupsPage?: number) => {
    this.setState({ loading: true });

    const { template } = this.props;
    const { query, filter, selectedPermission } = this.state;

    const getUsers: Promise<{ paging?: Paging; users: PermissionUser[] }> =
      filter !== 'groups'
        ? api.getPermissionTemplateUsers({
            templateId: template.id,
            q: query || undefined,
            permission: selectedPermission,
            p: usersPage,
          })
        : Promise.resolve({ paging: undefined, users: [] });

    const getGroups: Promise<{ groups: PermissionGroup[]; paging?: Paging }> =
      filter !== 'users'
        ? api.getPermissionTemplateGroups({
            templateId: template.id,
            q: query || undefined,
            permission: selectedPermission,
            p: groupsPage,
          })
        : Promise.resolve({ paging: undefined, groups: [] });

    return Promise.all([getUsers, getGroups]);
  };

  requestHolders = async () => {
    const [{ users, paging: usersPaging }, { groups, paging: groupsPaging }] =
      await this.loadUsersAndGroups();

    if (this.mounted) {
      this.setState({
        groups,
        groupsPaging,
        loading: false,
        users,
        usersPaging,
      });
    }
  };

  onLoadMore = async () => {
    const { usersPaging, groupsPaging } = this.state;
    this.setState({
      loading: true,
    });
    const [usersResponse, groupsResponse] = await this.loadUsersAndGroups(
      usersPaging ? usersPaging.pageIndex + 1 : 1,
      groupsPaging ? groupsPaging.pageIndex + 1 : 1,
    );
    if (this.mounted) {
      this.setState(({ groups, users }) => ({
        groups: [...groups, ...groupsResponse.groups],
        groupsPaging: groupsResponse.paging,
        loading: false,
        users: [...users, ...usersResponse.users],
        usersPaging: usersResponse.paging,
      }));
    }
  };

  removePermissionFromEntity = <T extends { login?: string; name: string; permissions: string[] }>(
    entities: T[],
    entity: string,
    permission: string,
  ): T[] =>
    entities.map((candidate) =>
      candidate.name === entity || candidate.login === entity
        ? { ...candidate, permissions: without(candidate.permissions, permission) }
        : candidate,
    );

  addPermissionToEntity = <T extends { login?: string; name: string; permissions: string[] }>(
    entities: T[],
    entity: string,
    permission: string,
  ): T[] =>
    entities.map((candidate) =>
      candidate.name === entity || candidate.login === entity
        ? { ...candidate, permissions: [...candidate.permissions, permission] }
        : candidate,
    );

  grantPermissionToUser = (login: string, permission: string) => {
    const { template } = this.props;
    const isProjectCreator = login === '<creator>';

    this.setState(({ users }) => ({
      users: this.addPermissionToEntity(users, login, permission),
      loading: true,
    }));

    const request = isProjectCreator
      ? api.addProjectCreatorToTemplate(template.id, permission)
      : api.grantTemplatePermissionToUser({
          templateId: template.id,
          login,
          permission,
        });

    return request
      .then(this.props.refresh)
      .then(() => {
        this.setState({ loading: false });
      })
      .catch(() => {
        this.setState(({ users }) => ({
          users: this.removePermissionFromEntity(users, login, permission),
          loading: false,
        }));
      });
  };

  revokePermissionFromUser = (login: string, permission: string) => {
    const { template } = this.props;
    const isProjectCreator = login === '<creator>';

    this.setState(({ users }) => ({
      users: this.removePermissionFromEntity(users, login, permission),
      loading: true,
    }));

    const request = isProjectCreator
      ? api.removeProjectCreatorFromTemplate(template.id, permission)
      : api.revokeTemplatePermissionFromUser({
          templateId: template.id,
          login,
          permission,
        });

    return request
      .then(this.props.refresh)
      .then(() => {
        this.setState({ loading: false });
      })
      .catch(() => {
        this.setState(({ users }) => ({
          users: this.addPermissionToEntity(users, login, permission),
          loading: false,
        }));
      });
  };

  grantPermissionToGroup = (groupName: string, permission: string) => {
    const { template } = this.props;

    this.setState(({ groups }) => ({
      groups: this.addPermissionToEntity(groups, groupName, permission),
      loading: true,
    }));

    return api
      .grantTemplatePermissionToGroup({
        templateId: template.id,
        groupName,
        permission,
      })
      .then(this.props.refresh)
      .then(() => {
        this.setState({ loading: false });
      })
      .catch(() => {
        this.setState(({ groups }) => ({
          groups: this.removePermissionFromEntity(groups, groupName, permission),
          loading: false,
        }));
      });
  };

  revokePermissionFromGroup = (groupName: string, permission: string) => {
    const { template } = this.props;

    this.setState(({ groups }) => ({
      groups: this.removePermissionFromEntity(groups, groupName, permission),
      loading: true,
    }));

    return api
      .revokeTemplatePermissionFromGroup({
        templateId: template.id,
        groupName,
        permission,
      })
      .then(this.props.refresh)
      .then(() => {
        this.setState({ loading: false });
      })
      .catch(() => {
        this.setState(({ groups }) => ({
          groups: this.addPermissionToEntity(groups, groupName, permission),
          loading: false,
        }));
      });
  };

  handleSearch = (query: string) => {
    this.setState({ query }, () => {
      this.requestHolders().catch(() => {
        /* noop */
      });
    });
  };

  handleFilter = (filter: FilterOption) => {
    this.setState({ filter }, () => {
      this.requestHolders().catch(() => {
        /* noop */
      });
    });
  };

  handleSelectPermission = (selectedPermission: string) => {
    if (selectedPermission === this.state.selectedPermission) {
      this.setState({ selectedPermission: undefined }, () => {
        this.requestHolders().catch(() => {
          /* noop */
        });
      });
    } else {
      this.setState({ selectedPermission }, () => {
        this.requestHolders().catch(() => {
          /* noop */
        });
      });
    }
  };

  shouldDisplayCreator = (creatorPermissions: string[]) => {
    const { filter, query, selectedPermission } = this.state;
    const CREATOR_NAME = translate('permission_templates.project_creators');

    const isFiltered = filter !== 'all';

    const matchQuery = !query || CREATOR_NAME.toLocaleLowerCase().includes(query.toLowerCase());

    const matchPermission =
      selectedPermission === undefined || creatorPermissions.includes(selectedPermission);

    return !isFiltered && matchQuery && matchPermission;
  };

  render() {
    const { template, topQualifiers } = this.props;
    const { users, loading, groups, groupsPaging, usersPaging, selectedPermission, filter, query } =
      this.state;
    const permissions = convertToPermissionDefinitions(
      PERMISSIONS_ORDER_FOR_PROJECT_TEMPLATE,
      'projects_role',
    );
    const allUsers = [...users];

    const creatorPermissions = template.permissions
      .filter((p) => p.withProjectCreator)
      .map((p) => p.key);

    let usersPagingWithCreator = usersPaging;

    if (this.shouldDisplayCreator(creatorPermissions)) {
      const creator = {
        login: '<creator>',
        name: translate('permission_templates.project_creators'),
        permissions: creatorPermissions,
      };

      allUsers.unshift(creator);
      usersPagingWithCreator = usersPaging
        ? { ...usersPaging, total: usersPaging.total + 1 }
        : undefined;
    }

    return (
      <LargeCenteredLayout id="permission-template">
        <PageContentFontWrapper className="sw-my-8 sw-typo-default">
          <Helmet defer={false} title={template.name} />

          <TemplateHeader
            refresh={this.props.refresh}
            template={template}
            topQualifiers={topQualifiers}
          />
          <main>
            <TemplateDetails template={template} />
            <ProvisioningWarning />

            <AllHoldersList
              filter={filter}
              groups={groups}
              groupsPaging={groupsPaging}
              loading={loading}
              onFilter={this.handleFilter}
              onGrantPermissionToGroup={this.grantPermissionToGroup}
              onGrantPermissionToUser={this.grantPermissionToUser}
              onLoadMore={this.onLoadMore}
              onQuery={this.handleSearch}
              onRevokePermissionFromGroup={this.revokePermissionFromGroup}
              onRevokePermissionFromUser={this.revokePermissionFromUser}
              onSelectPermission={this.handleSelectPermission}
              permissions={permissions}
              query={query}
              selectedPermission={selectedPermission}
              users={allUsers}
              usersPaging={usersPagingWithCreator}
            />
          </main>
        </PageContentFontWrapper>
      </LargeCenteredLayout>
    );
  }
}
