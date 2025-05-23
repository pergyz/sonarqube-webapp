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

import { DropdownMenu } from '@sonarsource/echoes-react';
import { BranchParameters } from '~shared/types/branch-like';
import { Extension } from '~shared/types/common';
import { ComponentQualifier } from '~shared/types/component';
import { addons } from '~sq-server-addons/index';
import { DEFAULT_ISSUES_QUERY } from '~sq-server-commons/components/shared/utils';
import withAvailableFeatures, {
  WithAvailableFeaturesProps,
} from '~sq-server-commons/context/available-features/withAvailableFeatures';
import { useCurrentUser } from '~sq-server-commons/context/current-user/CurrentUserContext';
import { DisabledTabLink, NavBarTabLink, NavBarTabs } from '~sq-server-commons/design-system';
import { hasMessage, translate, translateWithParameters } from '~sq-server-commons/helpers/l10n';
import { getPortfolioUrl, getProjectQueryUrl } from '~sq-server-commons/helpers/urls';
import { useBranchesQuery, useCurrentBranchQuery } from '~sq-server-commons/queries/branch';
import { useGetValueQuery } from '~sq-server-commons/queries/settings';
import { useLocation } from '~sq-server-commons/sonar-aligned/components/hoc/withRouter';
import {
  getBranchLikeQuery,
  isPullRequest,
} from '~sq-server-commons/sonar-aligned/helpers/branch-like';
import { isPortfolioLike } from '~sq-server-commons/sonar-aligned/helpers/component';
import { isApplication, isProject } from '~sq-server-commons/types/component';
import { Feature } from '~sq-server-commons/types/features';
import { SettingsKey } from '~sq-server-commons/types/settings';
import { Component } from '~sq-server-commons/types/types';

const SETTINGS_URLS = [
  '/project/admin',
  '/project/baseline',
  '/project/branches',
  '/project/settings',
  '/project/license_profiles',
  '/project/quality_profiles',
  '/project/quality_gate',
  '/project/links',
  '/project_roles',
  '/project/history',
  'background_tasks',
  '/project/key',
  '/project/deletion',
  '/project/webhooks',
];

interface Props extends WithAvailableFeaturesProps {
  component: Component;
  isInProgress?: boolean;
  isLanguageSupportedByDesignAndArchitecture?: boolean;
  isPending?: boolean;
}

type Query = BranchParameters & { id: string };

export function Menu(props: Readonly<Props>) {
  const {
    component,
    hasFeature,
    isInProgress,
    isPending,
    isLanguageSupportedByDesignAndArchitecture,
  } = props;
  const { extensions = [], canBrowseAllChildProjects, qualifier, configuration = {} } = component;

  const { data: branchLikes = [] } = useBranchesQuery(component);
  const { data: branchLike } = useCurrentBranchQuery(component);

  const { data: architectureOptIn, isLoading: isLoadingArchitectureOptIn } = useGetValueQuery({
    key: SettingsKey.DesignAndArchitecture,
  });

  const { currentUser } = useCurrentUser();

  const isApplicationChildInaccessble = isApplication(qualifier) && !canBrowseAllChildProjects;

  const location = useLocation();

  const hasAnalysis = () => {
    const hasBranches = branchLikes.length > 1;
    return hasBranches || isInProgress || isPending || component.analysisDate !== undefined;
  };

  const isGovernanceEnabled = extensions.some((extension) =>
    extension.key.startsWith('governance/'),
  );

  const getQuery = (): Query => {
    return { id: component.key, ...getBranchLikeQuery(branchLike) };
  };

  const renderLinkWhenInaccessibleChild = (label: string) => {
    return (
      <DisabledTabLink
        label={label}
        overlay={translateWithParameters(
          'layout.all_project_must_be_accessible',
          translate('qualifier', qualifier),
        )}
      />
    );
  };

  const renderMenuLink = ({
    label,
    pathname,
    additionalQueryParams = {},
  }: {
    additionalQueryParams?: Record<string, string>;
    label: string;
    pathname: string;
  }) => {
    const query = getQuery();
    if (isApplicationChildInaccessble) {
      return renderLinkWhenInaccessibleChild(label);
    }
    return hasAnalysis() ? (
      <NavBarTabLink
        text={label}
        to={{
          pathname,
          search: new URLSearchParams({ ...query, ...additionalQueryParams }).toString(),
        }}
      />
    ) : (
      <DisabledTabLink label={label} overlay={translate('layout.must_be_configured')} />
    );
  };

  const renderDashboardLink = () => {
    const { id, ...branchLike } = getQuery();

    if (isPortfolioLike(qualifier)) {
      return isGovernanceEnabled ? (
        <NavBarTabLink text={translate('overview.page')} to={getPortfolioUrl(id)} />
      ) : null;
    }

    const showingTutorial = location.pathname.includes('/tutorials');

    if (showingTutorial) {
      return (
        <DisabledTabLink
          label={translate('overview.page')}
          overlay={translate('layout.must_be_configured')}
        />
      );
    }

    if (isApplicationChildInaccessble) {
      return renderLinkWhenInaccessibleChild(translate('overview.page'));
    }
    return (
      <NavBarTabLink text={translate('overview.page')} to={getProjectQueryUrl(id, branchLike)} />
    );
  };

  const renderBreakdownLink = () => {
    return isPortfolioLike(qualifier) && isGovernanceEnabled
      ? renderMenuLink({
          label: translate('portfolio_breakdown.page'),
          pathname: '/code',
        })
      : null;
  };

  const renderCodeLink = () => {
    if (isPortfolioLike(qualifier)) {
      return null;
    }

    const label = isApplication(qualifier)
      ? translate('view_projects.page')
      : translate('code.page');

    return renderMenuLink({ label, pathname: '/code' });
  };

  const renderActivityLink = () => {
    if (isPullRequest(branchLike)) {
      return null;
    }

    return renderMenuLink({
      label: translate('project_activity.page'),
      pathname: '/project/activity',
    });
  };

  const renderIssuesLink = () => {
    return renderMenuLink({
      label: translate('issues.page'),
      pathname: '/project/issues',
      additionalQueryParams: DEFAULT_ISSUES_QUERY,
    });
  };

  const renderComponentMeasuresLink = () => {
    return renderMenuLink({
      label: translate('layout.measures'),
      pathname: '/component_measures',
    });
  };

  const renderSecurityHotspotsLink = () => {
    const isPortfolio = isPortfolioLike(qualifier);
    return (
      !isPortfolio &&
      renderMenuLink({
        label: translate('layout.security_hotspots'),
        pathname: '/security_hotspots',
      })
    );
  };

  const renderReleasesLink = () => {
    if (!currentUser.isLoggedIn || !hasFeature(Feature.Sca)) {
      return null;
    }

    return renderMenuLink({
      label: translate('dependencies.bill_of_materials'),
      pathname: `/${addons.sca?.RELEASES_ROUTE_NAME}`,
    });
  };

  const renderReleaseRisksLink = () => {
    if (!currentUser.isLoggedIn || !hasFeature(Feature.Sca)) {
      return null;
    }

    return renderMenuLink({
      label: translate('dependencies.risks'),
      pathname: `/${addons.sca?.RISKS_ROUTE_NAME}`,
    });
  };

  const renderLicenseProfilesLink = (query: Query) => {
    // License profiles are only available for Sca and not for portfolios
    const isPortfolio = isPortfolioLike(qualifier);
    if (!currentUser.isLoggedIn || isPortfolio || !hasFeature(Feature.Sca)) {
      return null;
    }

    /** For right now, license profile permissions are based on quality profiles */
    if (!configuration.showQualityProfiles) {
      return null;
    }

    return (
      <DropdownMenu.ItemLink
        key="license-profiles"
        to={{
          pathname: addons.sca?.PROJECT_LICENSE_ROUTE_NAME,
          search: new URLSearchParams(query).toString(),
        }}
      >
        {translate('sca.licenses.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderArchitectureLink = () => {
    if (
      !currentUser.isLoggedIn ||
      !hasFeature(Feature.Architecture) ||
      !isLanguageSupportedByDesignAndArchitecture
    ) {
      return null;
    }
    return renderMenuLink({
      label: translate('layout.architecture'),
      pathname: '/architecture',
    });
  };

  const renderSecurityReports = () => {
    if (isPullRequest(branchLike)) {
      return null;
    }

    const hasSecurityReportsEnabled = extensions.some((extension) =>
      extension.key.startsWith('securityreport/'),
    );

    if (!hasSecurityReportsEnabled) {
      return null;
    }

    return renderMenuLink({
      label: translate('layout.security_reports'),
      pathname: '/project/extension/securityreport/securityreport',
    });
  };

  const renderAdministration = () => {
    const query = getQuery();

    if (!configuration.showSettings || isPullRequest(branchLike)) {
      return null;
    }

    const isSettingsActive = SETTINGS_URLS.some((url) => window.location.href.includes(url));

    const adminLinks = renderAdministrationLinks(
      query,
      isProject(qualifier),
      isApplication(qualifier),
      isPortfolioLike(qualifier),
    );

    if (!adminLinks.some((link) => link != null)) {
      return null;
    }

    return (
      <DropdownMenu data-test="administration" id="component-navigation-admin" items={adminLinks}>
        <NavBarTabLink
          active={isSettingsActive}
          preventDefault // not really a link, we just use the same style to be consistent
          text={
            hasMessage('layout.settings', component.qualifier)
              ? translate('layout.settings', component.qualifier)
              : translate('layout.settings')
          }
          to={{}} // not really a link, we just use the same style to be consistent
          withChevron
        />
      </DropdownMenu>
    );
  };

  const renderAdministrationLinks = (
    query: Query,
    isProject: boolean,
    isApplication: boolean,
    isPortfolio: boolean,
  ) => {
    return [
      renderSettingsLink(query, isApplication, isPortfolio),
      renderBranchesLink(query, isProject),
      renderBaselineLink(query, isApplication, isPortfolio),
      ...renderAdminExtensions(query, isApplication),
      renderImportExportLink(query, isProject),
      renderProfilesLink(query),
      renderLicenseProfilesLink(query),
      renderQualityGateLink(query),
      renderLinksLink(query),
      renderPermissionsLink(query),
      renderBackgroundTasksLink(query),
      renderUpdateKeyLink(query),
      renderWebhooksLink(query, isProject),
      renderDeletionLink(query),
    ];
  };

  const renderProjectInformationButton = () => {
    const label = translate(isProject(qualifier) ? 'project' : 'application', 'info.title');
    const query = getQuery();

    if (isPullRequest(branchLike)) {
      return null;
    }

    if (isApplicationChildInaccessble) {
      return renderLinkWhenInaccessibleChild(label);
    }

    return (
      (isProject(qualifier) || isApplication(qualifier)) && (
        <NavBarTabLink
          text={label}
          to={{ pathname: '/project/information', search: new URLSearchParams(query).toString() }}
        />
      )
    );
  };

  const renderSettingsLink = (query: Query, isApplication: boolean, isPortfolio: boolean) => {
    if (!configuration.showSettings || isApplication || isPortfolio) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="settings"
        to={{ pathname: '/project/settings', search: new URLSearchParams(query).toString() }}
      >
        {translate('project_settings.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderBranchesLink = (query: Query, isProject: boolean) => {
    if (
      !hasFeature(Feature.BranchSupport) ||
      !isProject ||
      !configuration.showSettings ||
      !addons.branches
    ) {
      return null;
    }

    return (
      <DropdownMenu.ItemLink
        key="branches"
        to={{ pathname: '/project/branches', search: new URLSearchParams(query).toString() }}
      >
        {translate('project_branch_pull_request.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderBaselineLink = (query: Query, isApplication: boolean, isPortfolio: boolean) => {
    if (!configuration.showSettings || isApplication || isPortfolio) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="baseline"
        to={{ pathname: '/project/baseline', search: new URLSearchParams(query).toString() }}
      >
        {translate('project_baseline.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderImportExportLink = (query: Query, isProject: boolean) => {
    if (!isProject) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="import-export"
        to={{
          pathname: '/project/import_export',
          search: new URLSearchParams(query).toString(),
        }}
      >
        {translate('project_dump.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderProfilesLink = (query: Query) => {
    if (!configuration.showQualityProfiles) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="profiles"
        to={{
          pathname: '/project/quality_profiles',
          search: new URLSearchParams(query).toString(),
        }}
      >
        {translate('project_quality_profiles.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderQualityGateLink = (query: Query) => {
    if (!configuration.showQualityGates) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="quality_gate"
        to={{ pathname: '/project/quality_gate', search: new URLSearchParams(query).toString() }}
      >
        {translate('project_quality_gate.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderLinksLink = (query: Query) => {
    if (!configuration.showLinks) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="links"
        to={{ pathname: '/project/links', search: new URLSearchParams(query).toString() }}
      >
        {translate('project_links.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderPermissionsLink = (query: Query) => {
    if (!configuration.showPermissions) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="permissions"
        to={{ pathname: '/project_roles', search: new URLSearchParams(query).toString() }}
      >
        {translate('permissions.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderBackgroundTasksLink = (query: Query) => {
    if (!configuration.showBackgroundTasks) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="background_tasks"
        to={{
          pathname: '/project/background_tasks',
          search: new URLSearchParams(query).toString(),
        }}
      >
        {translate('background_tasks.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderUpdateKeyLink = (query: Query) => {
    if (!configuration.showUpdateKey) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="update_key"
        to={{ pathname: '/project/key', search: new URLSearchParams(query).toString() }}
      >
        {translate('update_key.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderWebhooksLink = (query: Query, isProject: boolean) => {
    if (!configuration.showSettings || !isProject) {
      return null;
    }
    return (
      <DropdownMenu.ItemLink
        key="webhooks"
        to={{ pathname: '/project/webhooks', search: new URLSearchParams(query).toString() }}
      >
        {translate('webhooks.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderDeletionLink = (query: Query) => {
    if (!configuration.showSettings) {
      return null;
    }

    if (
      ![
        ComponentQualifier.Project,
        ComponentQualifier.Portfolio,
        ComponentQualifier.Application,
      ].includes(qualifier as ComponentQualifier)
    ) {
      return null;
    }

    return (
      <DropdownMenu.ItemLink
        key="project_delete"
        to={{ pathname: '/project/deletion', search: new URLSearchParams(query).toString() }}
      >
        {translate('deletion.page')}
      </DropdownMenu.ItemLink>
    );
  };

  const renderExtension = ({ key, name }: Extension, isAdmin: boolean, baseQuery: Query) => {
    const pathname = isAdmin ? `/project/admin/extension/${key}` : `/project/extension/${key}`;
    const query = { ...baseQuery, qualifier };
    return (
      <DropdownMenu.ItemLink
        key={key}
        to={{ pathname, search: new URLSearchParams(query).toString() }}
      >
        {name}
      </DropdownMenu.ItemLink>
    );
  };

  const renderAdminExtensions = (query: Query, isApplication: boolean) => {
    const extensions = component.configuration?.extensions ?? [];
    return extensions
      .filter((e) => !isApplication || e.key !== 'governance/console')
      .map((e) => renderExtension(e, true, query));
  };

  const renderExtensions = () => {
    const query = getQuery();
    const withoutSecurityExtension = extensions.filter(
      (extension) =>
        !extension.key.startsWith('securityreport/') && !extension.key.startsWith('governance/'),
    );

    if (withoutSecurityExtension.length === 0) {
      return null;
    }

    return (
      <DropdownMenu
        data-test="extensions"
        id="component-navigation-more"
        items={withoutSecurityExtension.map((e) => renderExtension(e, false, query))}
      >
        <NavBarTabLink preventDefault text={translate('more')} to={{}} withChevron />
      </DropdownMenu>
    );
  };

  return (
    <div className="sw-flex sw-justify-between sw-pt-4 it__navbar-tabs">
      <NavBarTabs className="sw-gap-4">
        {renderDashboardLink()}
        {renderBreakdownLink()}
        {renderIssuesLink()}
        {renderSecurityHotspotsLink()}
        {renderReleaseRisksLink()}
        {renderSecurityReports()}
        {renderComponentMeasuresLink()}
        {renderCodeLink()}
        {renderReleasesLink()}
        {!isLoadingArchitectureOptIn &&
          architectureOptIn?.value === 'true' &&
          renderArchitectureLink()}
        {renderActivityLink()}
        {renderExtensions()}
      </NavBarTabs>
      <NavBarTabs className="sw-gap-4">
        {renderAdministration()}
        {renderProjectInformationButton()}
      </NavBarTabs>
    </div>
  );
}

export default withAvailableFeatures(Menu);
