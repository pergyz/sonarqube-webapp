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

import { addDays, subDays } from 'date-fns';
import { ModeServiceMock } from '~sq-server-commons/api/mocks/ModeServiceMock';
import SystemServiceMock from '~sq-server-commons/api/mocks/SystemServiceMock';
import { getEdition } from '~sq-server-commons/helpers/editions';
import { mockAppState } from '~sq-server-commons/helpers/testMocks';
import { renderComponent } from '~sq-server-commons/helpers/testReactTestingUtils';
import { byRole, byText } from '~sq-server-commons/sonar-aligned/helpers/testSelector';
import { AppState } from '~sq-server-commons/types/appstate';
import { EditionKey } from '~sq-server-commons/types/editions';
import { FCProps } from '~sq-server-commons/types/misc';
import { Mode } from '~sq-server-commons/types/mode';
import GlobalFooter from '../GlobalFooter';

const systemMock = new SystemServiceMock();
const modeHandler = new ModeServiceMock();

const COMMUNITY = getEdition(EditionKey.community).name;

afterEach(() => {
  modeHandler.reset();
  systemMock.reset();
});

it('should render the logged-in information', async () => {
  renderGlobalFooter({}, { edition: EditionKey.community });

  expect(ui.footerListItems.getAll()).toHaveLength(8);

  expect(byText(COMMUNITY).get()).toBeInTheDocument();
  expect(await ui.versionLabel('4.2').find()).toBeInTheDocument();
  expect(ui.ltaDocumentationLinkActive.query()).not.toBeInTheDocument();
  expect(ui.apiLink.get()).toBeInTheDocument();
});

it('should render the inactive version and cleanup build number', async () => {
  systemMock.setSystemUpgrades({ installedVersionActive: false });
  renderGlobalFooter({}, { version: '4.2 (build 12345)' });

  expect(ui.versionLabel('4.2.12345').get()).toBeInTheDocument();
  expect(await ui.ltaDocumentationLinkInactive.find()).toBeInTheDocument();
});

it('should show active status if offline and did not reach EOL', async () => {
  systemMock.setSystemUpgrades({ installedVersionActive: undefined });
  renderGlobalFooter(
    {},
    { version: '4.2 (build 12345)', versionEOL: addDays(new Date(), 10).toISOString() },
  );

  expect(await ui.ltaDocumentationLinkActive.find()).toBeInTheDocument();
});

it('should show inactive status if offline and reached EOL', async () => {
  systemMock.setSystemUpgrades({ installedVersionActive: undefined });
  renderGlobalFooter(
    {},
    { version: '4.2 (build 12345)', versionEOL: subDays(new Date(), 10).toISOString() },
  );

  expect(await ui.ltaDocumentationLinkInactive.find()).toBeInTheDocument();
});

it.each([
  ['Standard', Mode.Standard, 'STANDARD'],
  ['MQR', Mode.MQR, 'MQR'],
])('should show correct %s mode', async (_, mode, expected) => {
  modeHandler.setMode(mode);
  renderGlobalFooter();

  expect(await byText(`footer.mode.${expected}`).find()).toBeInTheDocument();
});

it('should not render missing logged-in information', () => {
  renderGlobalFooter({}, { edition: undefined, version: '' });

  expect(ui.footerListItems.getAll()).toHaveLength(5);

  expect(byText(COMMUNITY).query()).not.toBeInTheDocument();
  expect(ui.versionLabel().query()).not.toBeInTheDocument();
});

it('should not render the logged-in information', () => {
  renderGlobalFooter({ hideLoggedInInfo: true }, { edition: EditionKey.community });

  expect(ui.footerListItems.getAll()).toHaveLength(4);

  expect(byText(COMMUNITY).query()).not.toBeInTheDocument();
  expect(ui.versionLabel().query()).not.toBeInTheDocument();
  expect(ui.apiLink.query()).not.toBeInTheDocument();
});

function renderGlobalFooter(
  props: Partial<FCProps<typeof GlobalFooter>> = {},
  appStateOverride: Partial<AppState> = {},
) {
  return renderComponent(<GlobalFooter {...props} />, '/', {
    appState: mockAppState({
      productionDatabase: true,
      edition: EditionKey.developer,
      version: '4.2',
      ...appStateOverride,
    }),
  });
}

const ui = {
  footerListItems: byRole('listitem'),
  versionLabel: (version?: string) =>
    version ? byText(/footer\.version\.short\.*(\d.\d)/) : byText(/footer\.version\.short/),

  // links
  websiteLink: byRole('link', { name: 'SonarQube™' }),
  companyLink: byRole('link', { name: 'SonarSource SA' }),
  licenseLink: byRole('link', { name: 'footer.license' }),
  communityLink: byRole('link', { name: 'footer.community' }),
  docsLink: byRole('link', { name: 'opens_in_new_window footer.documentation' }),
  pluginsLink: byRole('link', { name: 'opens_in_new_window footer.plugins' }),
  apiLink: byRole('link', { name: 'footer.web_api' }),
  ltaDocumentationLinkActive: byRole('link', {
    name: `footer.version.status.active`,
  }),
  ltaDocumentationLinkInactive: byRole('link', {
    name: `footer.version.status.inactive`,
  }),
};
