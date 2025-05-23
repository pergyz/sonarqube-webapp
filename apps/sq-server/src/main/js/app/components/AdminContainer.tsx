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
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import { Extension } from '~shared/types/common';
import { getSettingsNavigation } from '~sq-server-commons/api/navigation';
import { getPendingPlugins } from '~sq-server-commons/api/plugins';
import { getSystemStatus, waitSystemUPStatus } from '~sq-server-commons/api/system';
import AdminContext, {
  defaultPendingPlugins,
  defaultSystemStatus,
} from '~sq-server-commons/context/AdminContext';
import withAppStateContext from '~sq-server-commons/context/app-state/withAppStateContext';
import { translate } from '~sq-server-commons/helpers/l10n';
import { getIntl } from '~sq-server-commons/helpers/l10nBundle';
import { AdminPagesContext } from '~sq-server-commons/types/admin';
import { AppState } from '~sq-server-commons/types/appstate';
import { PendingPluginResult } from '~sq-server-commons/types/plugins';
import { SysStatus } from '~sq-server-commons/types/types';
import handleRequiredAuthorization from '../utils/handleRequiredAuthorization';
import SettingsNav from './nav/settings/SettingsNav';

export interface AdminContainerProps {
  appState: AppState;
}

interface State {
  adminPages: Extension[];
  pendingPlugins: PendingPluginResult;
  systemStatus: SysStatus;
}

export class AdminContainer extends React.PureComponent<AdminContainerProps, State> {
  intl = getIntl();
  mounted = false;
  portalAnchor: Element | null = null;
  state: State = {
    pendingPlugins: defaultPendingPlugins,
    systemStatus: defaultSystemStatus,
    adminPages: [],
  };

  componentDidMount() {
    this.mounted = true;
    this.portalAnchor = document.getElementById('component-nav-portal');
    if (!this.props.appState.canAdmin) {
      handleRequiredAuthorization();
    } else {
      this.fetchNavigationSettings();
      this.fetchPendingPlugins();
      this.fetchSystemStatus();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchNavigationSettings = () => {
    getSettingsNavigation().then(
      (r) => {
        this.setState({ adminPages: r.extensions });
      },
      () => {},
    );
  };

  fetchPendingPlugins = () => {
    getPendingPlugins().then(
      (pendingPlugins) => {
        if (this.mounted) {
          this.setState({ pendingPlugins });
        }
      },
      () => {},
    );
  };

  fetchSystemStatus = () => {
    getSystemStatus().then(
      ({ status }) => {
        if (this.mounted) {
          this.setState({ systemStatus: status });
          if (status === 'RESTARTING') {
            this.waitRestartingDone();
          }
        }
      },
      () => {},
    );
  };

  waitRestartingDone = () => {
    waitSystemUPStatus().then(
      ({ status }) => {
        if (this.mounted) {
          this.setState({ systemStatus: status });
          window.location.reload();
        }
      },
      () => {},
    );
  };

  render() {
    const { adminPages } = this.state;

    // Check that the adminPages are loaded
    if (!adminPages) {
      return null;
    }

    const { pendingPlugins, systemStatus } = this.state;
    const adminPagesContext: AdminPagesContext = { adminPages };

    return (
      <>
        <Helmet
          defer={false}
          titleTemplate={this.intl.formatMessage(
            { id: 'page_title.template.with_category' },
            { page: translate('layout.settings') },
          )}
        />
        {this.portalAnchor &&
          createPortal(
            <SettingsNav
              extensions={adminPages}
              fetchPendingPlugins={this.fetchPendingPlugins}
              fetchSystemStatus={this.fetchSystemStatus}
              pendingPlugins={pendingPlugins}
              systemStatus={systemStatus}
            />,
            this.portalAnchor,
          )}

        <AdminContext.Provider
          value={{
            fetchSystemStatus: this.fetchSystemStatus,
            fetchPendingPlugins: this.fetchPendingPlugins,
            pendingPlugins,
            systemStatus,
          }}
        >
          <Outlet context={adminPagesContext} />
        </AdminContext.Provider>
      </>
    );
  }
}

export default withAppStateContext(AdminContainer);
